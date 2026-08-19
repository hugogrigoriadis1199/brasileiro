import { Pool } from "pg";

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Método não permitido" });
	}

	try {
		const participantsResult = await pool.query(`
			SELECT position, name
			FROM participants
			WHERE championship_id = 1
			ORDER BY position
		`);

		const roundsResult = await pool.query(`
			SELECT
				r.round_number AS number,
				r.round_date AS date,
				p.position,
				COALESCE(s.points, 0) AS points
			FROM rounds r
			LEFT JOIN scores s ON s.round_id = r.id
			LEFT JOIN participants p ON p.id = s.participant_id
			WHERE r.championship_id = 1
			ORDER BY r.round_number, p.position
		`);

		const players = Array.from({ length: 20 }, (_, index) => {
			const participant = participantsResult.rows.find(
				row => row.position === index
			);
			return participant?.name || `Participante ${index + 1}`;
		});

		const rounds = [];
		for (const row of roundsResult.rows) {
			let round = rounds.find(item => item.number === row.number);
			if (!round) {
				round = {
					number: row.number,
					date: row.date
						? String(row.date).slice(0, 10)
						: "",
					scores: Array(20).fill(0)
				};
				rounds.push(round);
			}

			if (row.position !== null) {
				round.scores[row.position] = Number(row.points);
			}
		}

		return res.status(200).json({ players, rounds });
	} catch (error) {
		console.error("ERRO CARREGAR:", error);
		return res.status(500).json({ error: "Erro ao carregar dados" });
	}
}
