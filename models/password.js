import bcryptjs from "bcryptjs";

function getNumberOfRounds() {
  let rounds = 1;

  if (process.env.NODE_ENV === "production") {
    rounds = 14;
  }

  return rounds;
}

const secret = process.env.BCRYPT_SECRET;

async function hash(password) {
  const rounds = getNumberOfRounds();
  return bcryptjs.hash(secret + password, rounds);
}

async function compare(password, passwordHash) {
  return await bcryptjs.compare(secret + password, passwordHash);
}

const password = {
  hash,
  compare,
};

export default password;
