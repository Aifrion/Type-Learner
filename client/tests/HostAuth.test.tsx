import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HostLogin from "@/pages/HostLogin";
import HostRegister from "@/pages/HostRegister";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/firebase", () => ({
  auth: { kind: "auth" },
  db: { kind: "db" },
}));

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}));

const signInMock = vi.mocked(signInWithEmailAndPassword);
const createUserMock = vi.mocked(createUserWithEmailAndPassword);
const updateProfileMock = vi.mocked(updateProfile);
const docMock = vi.mocked(doc);
const setDocMock = vi.mocked(setDoc);
const serverTimestampMock = vi.mocked(serverTimestamp);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("HostLogin", () => {
  it("shows a validation error when required fields are missing", () => {
    render(<HostLogin />);

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      screen.getByText(/email and password are required/i)
    ).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("signs in and navigates home on success", async () => {
    signInMock.mockResolvedValue({} as never);

    render(<HostLogin />);

    fireEvent.change(screen.getByPlaceholderText("you@school.edu"), {
      target: { value: "teacher@school.edu" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(signInMock).toHaveBeenCalledWith(
        expect.anything(),
        "teacher@school.edu",
        "secret"
      )
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
  });

  it("shows an error message when sign-in fails", async () => {
    signInMock.mockRejectedValue(new Error("Invalid credentials"));

    render(<HostLogin />);

    fireEvent.change(screen.getByPlaceholderText("you@school.edu"), {
      target: { value: "teacher@school.edu" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

describe("HostRegister", () => {
  it("shows a validation error when required fields are missing", () => {
    render(<HostRegister />);

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      screen.getByText(/email and password are required/i)
    ).toBeInTheDocument();
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("creates the teacher record and navigates home on success", async () => {
    const user = { uid: "uid-123", email: "teacher@school.edu" };
    createUserMock.mockResolvedValue({ user } as never);
    updateProfileMock.mockResolvedValue(undefined);
    docMock.mockReturnValue("doc-ref" as never);
    serverTimestampMock.mockReturnValue("SERVER_TIME" as never);
    setDocMock.mockResolvedValue(undefined);

    render(<HostRegister />);

    fireEvent.change(screen.getByPlaceholderText("Mrs. Johnson"), {
      target: { value: "Ms. Ada" },
    });
    fireEvent.change(screen.getByPlaceholderText("Lincoln Middle School"), {
      target: { value: "Lincoln High" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@school.edu"), {
      target: { value: "teacher@school.edu" },
    });
    fireEvent.change(screen.getByPlaceholderText("Create a password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(createUserMock).toHaveBeenCalledWith(
        expect.anything(),
        "teacher@school.edu",
        "secret"
      )
    );
    expect(updateProfileMock).toHaveBeenCalledWith(user, {
      displayName: "Ms. Ada",
    });
    expect(docMock).toHaveBeenCalledWith(
      expect.anything(),
      "teacherInformation",
      "uid-123"
    );
    expect(setDocMock).toHaveBeenCalledWith(
      "doc-ref",
      expect.objectContaining({
        uid: "uid-123",
        email: "teacher@school.edu",
        name: "Ms. Ada",
        school: "Lincoln High",
        createdAt: "SERVER_TIME",
      })
    );
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
  });

  it("shows an error message when registration fails", async () => {
    createUserMock.mockRejectedValue(new Error("Registration failed"));

    render(<HostRegister />);

    fireEvent.change(screen.getByPlaceholderText("you@school.edu"), {
      target: { value: "teacher@school.edu" },
    });
    fireEvent.change(screen.getByPlaceholderText("Create a password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText(/registration failed/i)
    ).toBeInTheDocument();
    expect(setDocMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
