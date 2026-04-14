import fs from "fs/promises";
import path from "path";

async function renameImages({ dir, unit, figureNos, dryRun = false }) {
  try {
    const files = await fs.readdir(dir);

    if (!files || files.length === 0) {
      console.error("No files found. Aborting.");
      return;
    }

    // ✅ Filter + natural sort
    const images = files
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );

    // ✅ Validation: count match
    if (images.length !== figureNos.length) {
      console.error(
        `Mismatch: ${images.length} images vs ${figureNos.length} figureNos. Aborting.`
      );
      return;
    }

    // ✅ Check duplicates in figureNos
    const hasDuplicateInputs =
      new Set(figureNos.map(String)).size !== figureNos.length;

    if (hasDuplicateInputs) {
      console.error("Duplicate values found in figureNos. Aborting.");
      return;
    }

    // =========================
    // 🔥 STEP 1: TEMP RENAME
    // =========================
    const tempOps = images.map((file, i) => {
      const ext = path.extname(file);
      return {
        oldPath: path.join(dir, file),
        tempPath: path.join(dir, `__tmp_rename_${i}${ext}`),
      };
    });

    // =========================
    // 🔥 STEP 2: FINAL RENAME
    // =========================
    const finalOps = tempOps.map((op, i) => {
      const ext = path.extname(op.tempPath);
      return {
        tempPath: op.tempPath,
        newPath: path.join(
          dir,
          `figure_${unit}_${figureNos[i]}${ext}`
        ),
      };
    });

    // =========================
    // DRY RUN
    // =========================
    if (dryRun) {
      console.log("---- DRY RUN ----");
      images.forEach((img, i) => {
        console.log(
          `${img} → figure_${unit}_${figureNos[i]}`
        );
      });
      return;
    }

    // =========================
    // 🔥 EXECUTION PHASE
    // =========================

    // STEP 1: rename originals → temp
    for (const op of tempOps) {
      await fs.rename(op.oldPath, op.tempPath);
    }

    // STEP 2: rename temp → final
    for (const op of finalOps) {
      await fs.rename(op.tempPath, op.newPath);
    }

    console.log("✅ Renaming completed successfully!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}



// 🔹 Example usage
renameImages({
  dir: "./public/labels-img/g12/u6/",
  unit: 6,
  figureNos: [
    2, 3, 7, 13, "TQ"
  ],
  dryRun: false, // Set to true for a preview without renaming
});