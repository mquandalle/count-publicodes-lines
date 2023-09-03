#!/usr/bin/env zx

// Where to find the publicode files in each Github repository
const publicodesRepos = {
  "betagouv/mon-entreprise": [
    "modele-social/règles",
    "exoneration-covid/règles",
    "site/source/pages/assistants/demande-mobilité/",
  ],
  "incubateur-ademe/nosgestesclimat": "data",
  "SocialGouv/code-du-travail-numerique":
    "packages/code-du-travail-modeles/src/modeles",
  "laem/futureco-data": "",
  "mquandalle/mesaidesvelo": "src",
};

const extraFlags = {
  "incubateur-ademe/nosgestesclimat": [
    "-not",
    "-path",
    "nosgestesclimat/data/i18n/*",
  ],
};

const workingDirectory = "/tmp/count-lines";
await fs.emptyDir(workingDirectory);
cd(workingDirectory);

const linesPerRepo = await Promise.all(
  Object.entries(publicodesRepos).map(async ([repo, dirs]) => {
    await $`git clone https://github.com/${repo}.git --depth 1`;
    let nbLines = 0;
    for (const dir of [dirs].flat()) {
      const searchDirectory = repo.split("/")[1] + "/" + dir;
      const flags = [
        ...(extraFlags[repo] ?? []),
        "(",
        "-name",
        "*.yaml",
        "-o",
        "-name",
        "*.publicodes",
        ")",
      ];
      const command = $`find ${searchDirectory} ${flags} -exec cat {} \\;`;
      nbLines += parseInt((await command.pipe($`wc -l`)).stdout);
    }
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
      ? `[${name}](https://github.com/${name}/tree/master/${
          [publicodesRepos[name]].flat()[0]
        })`
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
