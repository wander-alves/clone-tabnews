import { InternalServerError } from "infra/errors.js";
import authorization from "models/authorization.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("it should throw an error when called without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("it should throw an error when called without `user.features`", () => {
      const createdUser = {
        username: "UsuárioDesfavorecido",
      };

      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });

    test("it should throw an error when called with unknown `feature`", () => {
      const createdUser = {
        username: "UsuárioDesfavorecido",
        features: ["unknow:feature"],
      };

      expect(() => {
        authorization.can(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("it should return `true` when called with valid `user` known `feature`", () => {
      const createdUser = {
        username: "UsuárioDesfavorecido",
        features: ["create:user"],
      };

      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("it should throw an error when called without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("it should throw an error when called without `user.features`", () => {
      const createdUser = {
        username: "UsuárioDesfavorecido",
      };

      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });

    test("it should throw an error when called with unknown `feature`", () => {
      const createdUser = {
        username: "UsuárioDesfavorecido",
      };

      expect(() => {
        authorization.filterOutput(createdUser, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("it should throw an error when called without `resource`", () => {
      const createdUser = {
        username: "UsuárioDesfavorecido",
        features: [],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });

    test("it should return `true` when called with valid `user` known `feature`", () => {
      const createdUser = {
        username: "default_user",
        features: ["read:user"],
        email: "default_user@email.com",
        password: "default_user",
        created_at: "2026-01-01T08:00:00.000Z",
        updated_at: "2026-01-01T08:00:00.000Z",
      };

      const targetResource = {
        username: "default_user",
        features: ["read:user"],
        email: "default_user@email.com",
        password: "default_user",
        created_at: "2026-01-01T08:00:00.000Z",
        updated_at: "2026-01-01T08:00:00.000Z",
      };

      const filteredOutput = authorization.filterOutput(
        createdUser,
        "read:user",
        targetResource,
      );

      expect(filteredOutput).toEqual({
        username: "default_user",
        features: ["read:user"],
        created_at: "2026-01-01T08:00:00.000Z",
        updated_at: "2026-01-01T08:00:00.000Z",
      });
    });
  });
});
