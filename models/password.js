import bcryptjs from "bcryptjs";

function getNumberOfRounds() {
  let rounds = 1;

  if (process.env.NODE_ENV === "production") {
    rounds = 14;
  }

  return rounds;
}

async function hash(password) {
  const rounds = getNumberOfRounds();
  return bcryptjs.hash(password, rounds);
}

async function compare(password, passwordHash) {
  return await bcryptjs.compare(password, passwordHash);
}

const password = {
  hash,
  compare,
};

export default password;
