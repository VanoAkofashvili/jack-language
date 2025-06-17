import { JackAnalyzer } from "./JackAnalyzer";

const src = process.argv[2];

if (!src) {
  console.error("Filename not provided");
  process.exit(1);
}

new JackAnalyzer(src).run()
