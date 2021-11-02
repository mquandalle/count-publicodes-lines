#!/usr/bin/env zx
const publicodesRepos = {
  "betagouv/mon-entreprise": "modele-social/règles",
  "datagir/nosgestesclimat": "data",
  "SocialGouv/code-du-travail-numerique":
    "packages/code-du-travail-modeles/src/modeles",
  "laem/futureco-data": "",
};

const workingDirectory = "/tmp/count-lines";
await fs.emptyDir(workingDirectory);
cd(workingDirectory);

const linesPerRepo = await Promise.all(
  Object.entries(publicodesRepos).map(async ([repo, dir]) => {
    await $`git clone https://github.com/${repo}.git --depth 1`;
    const searchDirectory = repo.split("/")[1] + "/" + dir;
    const command = $`find ${searchDirectory} -name '*.yaml' -exec cat {} \\;`;
    const nbLines = parseInt((await command.pipe($`wc -l`)).stdout);
    return { repo, nbLines };
  })
);

const sortedTable = [
  ...linesPerRepo.sort((a, b) => b.nbLines - a.nbLines),
  {
    repo: "Total",
    nbLines: linesPerRepo.reduce((acc, { nbLines }) => acc + nbLines, 0),
  },
];
console.table(sortedTable);

if (process.argv.slice(2).includes("--update")) {
  const { stdout: Readme } = await $`cat ${__dirname}/README.md`;
  const tagStart = "<!--table:start-->";
  const tagEnd = "<!--table:end-->";
  const repoUrl = (name) =>
    name in publicodesRepos
      ? `[${name}](https://github.com/${name}/tree/master/${publicodesRepos[name]})`
      : name;
  const formatNumber = (n) => n.toLocaleString("en");
  const generatedMarkdownTable = `${tagStart}
| Repository | Lines |
| --- | --: |
${sortedTable
  .map(({ repo, nbLines }) => `| ${repoUrl(repo)} | ${formatNumber(nbLines)} |`)
  .join("\n")}
${tagEnd}`;

  const newReadme = Readme.replace(/\n$/, "").replace(
    new RegExp(tagStart + "[\\s\\S]+" + tagEnd, "gm"),
    generatedMarkdownTable
  );
  await $`echo ${newReadme} > ${__dirname}/README.md`;
}
