const { exec } = require("node:child_process");

function checkPostgres() {
  exec(
    `ssh morgoth@mordor.local "docker exec cursodev-pg pg_isready --host localhost"`,
    handleReturn
  );

  function handleReturn(error, stdout) {
    const isPostgresReady = stdout.search("accepting connections") !== -1;
    if (!isPostgresReady) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }
  }
  console.log("\n O Serviço do Postgres está pronto para uso!");
}

process.stdout.write("\n Aguardando a inicialização do serviço Postgres ");
checkPostgres();
