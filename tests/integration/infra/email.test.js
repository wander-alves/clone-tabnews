import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

describe("infra/email.js", () => {
  beforeAll(async () => {
    await orchestrator.waitForAllServices();
  });
  test("it should be able to send an e-mail", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: '"John Doe" <john.doe@example.local>',
      to: '"Jane Doe" <jane.doe@example.local>',
      subject: "Hello world!",
      text: "Welcome!!!",
    });

    await email.send({
      from: '"John Doe" <john.doe@example.local>',
      to: '"Jane Doe" <jane.doe@example.local>',
      subject: "Last message",
      text: "Last message body.",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toEqual("<john.doe@example.local>");
    expect(lastEmail.recipients[0]).toEqual("<jane.doe@example.local>");
    expect(lastEmail.subject).toEqual("Last message");
    expect(lastEmail.text).toEqual("Last message body.\n");
  });
});
