function status(request, response) {
  return response.status(200).json({
    message: "It's ALIVE!!!.",
  });
}

export default status;
