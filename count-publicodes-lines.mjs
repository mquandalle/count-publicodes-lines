#!/usr/bin/env zx
const publicodesRepos = [
  {
    repo: "betagouv/mon-entreprise",
    dir: "modele-social/règles",
  },
  {
    repo: "datagir/nosgestesclimat",
    dir: "data",
  },
  {
    repo: "SocialGouv/code-du-travail-numerique",
    dir: "packages/code-du-travail-modeles/src/modeles",
  },
  {
    repo: "laem/futureco-data",
    dir: "",
  },
];

const workingDirectory = "/tmp/count-lines";
await $`rm -rf ${workingDirectory}`;
await $`mkdir ${workingDirectory}`;

const linesPerRepo = await Promise.all(
  publicodesRepos.map(async ({ repo, dir }) => {
    cd(workingDirectory);
    await $`git clone https://github.com/${repo}.git --depth 1`;
    const searchDirectory = repo.split("/")[1] + "/" + dir;
    const { stdout } = await $`fdfind . ${searchDirectory} -e yaml -X wc -l`;
    const nbLines = parseInt(stdout.split("\n").at(-2));
    return { repo, nbLines };
  })
);

console.table([
  ...linesPerRepo.sort((a, b) => b.nbLines - a.nbLines),
  {
    repo: "total",
    nbLines: linesPerRepo.reduce((acc, { nbLines }) => acc + nbLines, 0),
  },
]);
