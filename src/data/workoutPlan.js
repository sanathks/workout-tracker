export const weekConfig = [
  { week: 1, sets: 3, reps: 8, rest: "60–90s", tempo: "30x0", rpe: "Moderate" },
  { week: 2, sets: 3, reps: 8, rest: "60–90s", tempo: "30x0", rpe: "Moderate-High" },
  { week: 3, sets: 3, reps: 8, rest: "60–90s", tempo: "30x0", rpe: "High" },
  { week: 4, sets: 3, reps: 8, rest: "60–90s", tempo: "30x0", rpe: "Very High" },
  { week: 5, sets: 4, reps: 8, rest: "90–180s", tempo: "30x0", rpe: "High-Very High" },
  { week: 6, sets: 4, reps: 8, rest: "90–180s", tempo: "30x0", rpe: "Max Effort" },
  { week: 7, sets: 5, reps: 8, rest: "90–180s", tempo: "30x0", rpe: "Max Effort" },
  { week: 8, sets: 3, reps: 8, rest: "60–90s", tempo: "30x0", rpe: "Low-Moderate (Deload)" },
];

export const workoutDays = [
  {
    day: 1,
    name: "Push — Chest / Shoulders / Triceps / Calves",
    icon: "dumbbell",
    exercises: [
      { id: "d1_a1", code: "A1", name: "30° Incline DB Bench Press", note: "Semi pronated grip" },
      { id: "d1_b1", code: "B1", name: "Pec Deck Fly", note: "" },
      { id: "d1_c1", code: "C1", name: "Flat DB Bench Press", note: "Semi pronated grip" },
      { id: "d1_d1", code: "D1", name: "Standing DB Lateral Raise", note: "" },
      { id: "d1_e1", code: "E1", name: "Machine Shoulder Press", note: "Pin loaded" },
      { id: "d1_f1", code: "F1", name: "Rope Tricep Push Down", note: "" },
      { id: "d1_g1", code: "G1", name: "Single Arm Cable Push Down", note: "" },
      { id: "d1_h1", code: "H1", name: "Seated Calf Raise", note: "" },
    ],
  },
  {
    day: 2,
    name: "Pull — Back / Biceps / Traps",
    icon: "arrow-down-to-line",
    exercises: [
      { id: "d2_a1", code: "A1", name: "Seated Lat Pull Down", note: "Towards sternum, mid grip" },
      { id: "d2_b1", code: "B1", name: "Machine Row", note: "Pin loaded, neutral grip" },
      { id: "d2_c1", code: "C1", name: "Single Arm DB Row", note: "" },
      { id: "d2_d1", code: "D1", name: "Rear Delt Fly", note: "Pin loaded machine" },
      { id: "d2_e1", code: "E1", name: "Standing DB Shrug", note: "" },
      { id: "d2_f1", code: "F1", name: "Alternating DB Curls", note: "8 reps each arm" },
      { id: "d2_g1", code: "G1", name: "Alternating DB Hammer Curls", note: "8 reps each arm" },
    ],
  },
  {
    day: 3,
    name: "Legs — Quads / Hamstrings / Calves",
    icon: "footprints",
    exercises: [
      { id: "d3_a1", code: "A1", name: "Air Squats", note: "" },
      { id: "d3_b1", code: "B1", name: "Leg Press", note: "Pin loaded" },
      { id: "d3_c1", code: "C1", name: "Leg Extension", note: "Plantar flexed" },
      { id: "d3_d1", code: "D1", name: "Lying Leg Curls", note: "Dorsi flexed" },
      { id: "d3_e1", code: "E1", name: "DB Romanian Deadlift", note: "" },
      { id: "d3_f1", code: "F1", name: "Seated Calf Raise", note: "" },
    ],
  },
  {
    day: 4,
    name: "Push 2 — Chest / Shoulders / Triceps",
    icon: "flame",
    exercises: [
      { id: "d4_a1", code: "A1", name: "30° Incline DB Bench Press", note: "Semi pronated grip" },
      { id: "d4_b1", code: "B1", name: "Pec Deck Fly", note: "" },
      { id: "d4_c1", code: "C1", name: "Flat DB Bench Press", note: "Semi pronated grip" },
      { id: "d4_d1", code: "D1", name: "Standing DB Lateral Raise", note: "" },
      { id: "d4_e1", code: "E1", name: "Machine Shoulder Press", note: "Pin loaded" },
      { id: "d4_f1", code: "F1", name: "Rope Tricep Push Down", note: "" },
      { id: "d4_g1", code: "G1", name: "Single Arm Cable Push Down", note: "" },
    ],
  },
];
