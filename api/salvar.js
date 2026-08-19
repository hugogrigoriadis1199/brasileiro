import { Pool } from "pg";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Método não permitido" });
	}

	const { dados } = req.body || {};
	if (!dados || !Array.isArray(dados.players) || !Array.isArray(dados.rounds)) {
		return res.status(400).json({ error: "Formato de dados inválido" });
	}

	if (dados.players.length > 20 || dados.rounds.some(round => !round.number)) {
		return res.status(400).json({ error: "Dados fora do formato esperado" });
	}

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		await client.query(`
			INSERT INTO championships (id, name)
			VALUES (1, 'Meu Campeonato Cartola')
			ON CONFLICT (id) DO NOTHING
		`);

		for (let index = 0; index < 20; index += 1) {
			const name = String(
				dados.players[index] || `Participante ${index + 1}`
			).trim();

			await client.query(
				`
				INSERT INTO participants (championship_id, position, name)
				VALUES (1, $1, $2)
				ON CONFLICT (championship_id, position)
				DO UPDATE SET name = EXCLUDED.name
				`,
				[index, name || `Participante ${index + 1}`]
			);
		}

		const roundNumbers = dados.rounds.map(round => Number(round.number));
		await client.query(
			`
			DELETE FROM rounds
			WHERE championship_id = 1
				AND round_number <> ALL($1::int[])
			`,
			[roundNumbers]
		);

		for (const round of dados.rounds) {
			const roundResult = await client.query(
				`
				INSERT INTO rounds (championship_id, round_number, round_date)
				VALUES (1, $1, NULLIF($2, '')::date)
				ON CONFLICT (championship_id, round_number)
				DO UPDATE SET round_date = EXCLUDED.round_date
				RETURNING id
				`,
				[Number(round.number), round.date || ""]
			);

			const roundId = roundResult.rows[0].id;
			await client.query("DELETE FROM scores WHERE round_id = $1", [roundId]);

			for (let index = 0; index < 20; index += 1) {
				const points = Number(round.scores?.[index] || 0);
				if (!Number.isFinite(points)) {
					throw new Error("Pontuação inválida");
				}

				await client.query(
					`
					INSERT INTO scores (round_id, participant_id, points)
					SELECT $1, id, $3
					FROM participants
					WHERE championship_id = 1 AND position = $2
					`,
					[roundId, index, points]
				);
			}
		}

		await client.query("COMMIT");
		return res.status(200).json({ ok: true });
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("ERRO SALVAR:", error);
		return res.status(500).json({ error: "Erro ao salvar dados" });
	} finally {
		client.release();
	}
}
