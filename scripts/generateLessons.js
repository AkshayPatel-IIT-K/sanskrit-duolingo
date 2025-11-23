import fs from "fs";
import path from "path";
import csv from "csv-parser";

// 📌 PATHS — adjust if needed
const CSV_FILE = "sanskrit_lessons_bulk.csv";          // CSV on your project root
const OUTPUT_DIR = "src/lessons";                      // Where JSON lessons go

// 📌 Load CSV → return all rows
async function loadCSV() {
  return new Promise((resolve) => {
    const rows = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}

// 📌 Helper to shuffle wrong options
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// 📌 Main function
async function generateLessons() {
  console.log("📘 Loading CSV...");
  const rows = await loadCSV();

  console.log("📗 Grouping by lessons...");
  const lessonsMap = {};

  for (const row of rows) {
    const lessonId = row.Lesson;
    if (!lessonsMap[lessonId]) lessonsMap[lessonId] = [];
    lessonsMap[lessonId].push(row);
  }

  console.log("📙 Generating JSON files...");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const lessonId of Object.keys(lessonsMap).sort()) {
    const group = lessonsMap[lessonId];

    const questions = group.map((row) => {
      const correct = row.English;
      const wrongs = shuffle(
        ["Word A", "Word B", "Word C", "Word D", "Word E"].filter(
          (w) => w !== correct
        )
      ).slice(0, 3);

      return {
        prompt: `What is the meaning of '${row.Sanskrit}'?`,
        options: shuffle([correct, ...wrongs]),
        correct: correct
      };
    });

    const lessonJSON = {
      lesson_id: lessonId,
      title: `Lesson ${lessonId}`,
      level: "Auto",
      questions
    };

    const filePath = path.join(OUTPUT_DIR, `${lessonId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(lessonJSON, null, 2), "utf-8");

    console.log("✔ Generated", filePath);
  }

  console.log("\n🎉 ALL LESSONS GENERATED SUCCESSFULLY 🎉");
}

// Run the script
generateLessons();
