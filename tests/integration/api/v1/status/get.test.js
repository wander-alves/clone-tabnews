test("[GET] should status endpoint point return 200 when requested.", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");

  expect(response.status).toBe(200);
});
