import process from "node:process";

const rangePrefix = "--lines=";
const rangePattern = /^(?<start>[1-9]\d*):(?<end>[1-9]\d*)$/u;

async function readFiles(arguments_: string[]): Promise<string> {
  const ranges = arguments_.filter((argument) => argument.startsWith(rangePrefix));
  const paths = arguments_.filter((argument) => !argument.startsWith(rangePrefix));
  if (ranges.length > 1 || paths.length === 0) {
    throw new Error("Provide file paths and at most one --lines=start:end range.");
  }
  let start = 1;
  let end = Number.MAX_SAFE_INTEGER;
  const [range] = ranges;
  if (range !== undefined) {
    const { start: firstLine, end: lastLine } =
      rangePattern.exec(range.slice(rangePrefix.length))?.groups ?? {};
    start = Number(firstLine);
    end = Number(lastLine);
    if (!(Number.isSafeInteger(start) && Number.isSafeInteger(end)) || end < start) {
      throw new Error("Line ranges require positive safe integers with end >= start.");
    }
  }
  const sections = await Promise.all(
    paths.map(async (path) => {
      const lines = (await Bun.file(path).text()).split("\n");
      return `${path}\n${lines
        .slice(start - 1, end)
        .map((line, index) => `${start + index}: ${line}`)
        .join("\n")}\n`;
    }),
  );
  return sections.join("");
}

if (import.meta.main) {
  process.stdout.write(await readFiles(process.argv.slice(2)));
}

export { readFiles };
