import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HostDashboard from "@/pages/HostDashboard";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/firebase", () => ({
  auth: { kind: "auth" },
  db: { kind: "db" },
}));

let authStateCallback: ((user: { uid: string } | null) => void) | null = null;

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: unknown) => void) => {
    authStateCallback = cb;
    return () => {
      authStateCallback = null;
    };
  }),
  signOut: vi.fn(() => Promise.resolve()),
}));

const getDocsMock = vi.fn();
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  doc: vi.fn(),
  deleteDoc: vi.fn(() => Promise.resolve()),
}));

const onAuthStateChangedMock = vi.mocked(onAuthStateChanged);
const signOutMock = vi.mocked(signOut);
const deleteDocMock = vi.mocked(deleteDoc);
const docMock = vi.mocked(doc);

beforeEach(() => {
  vi.clearAllMocks();
  authStateCallback = null;
  getDocsMock.mockResolvedValue({
    docs: [
      {
        id: "set-1",
        data: () => ({ name: "My Real Set", questions: [{}, {}, {}] }),
      },
    ],
  });
});

function renderWithLoggedInUser() {
  render(<HostDashboard />);
  if (authStateCallback) authStateCallback({ uid: "teacher-123" });
}

describe("HostDashboard", () => {
  it("redirects to host-auth when user is null", () => {
    render(<HostDashboard />);
    if (authStateCallback) authStateCallback(null);
    expect(navigateMock).toHaveBeenCalledWith("/host-auth", {
      replace: true,
    });
  });

  it("shows loading until auth and fetch resolve", async () => {
    render(<HostDashboard />);
    expect(screen.getByText(/loading your question sets/i)).toBeInTheDocument();
    if (authStateCallback) authStateCallback({ uid: "teacher-123" });
    await waitFor(() => {
      expect(screen.getByText("My Question Sets")).toBeInTheDocument();
    });
    expect(screen.queryByText(/loading your question sets/i)).not.toBeInTheDocument();
  });

  it("shows Sample Quiz and real sets with correct titles", async () => {
    renderWithLoggedInUser();
    await waitFor(() => {
      expect(screen.getByText("Sample Quiz")).toBeInTheDocument();
      expect(screen.getByText("My Real Set")).toBeInTheDocument();
    });
  });

  it("shows Delete only for real sets, not for Sample Quiz", async () => {
    renderWithLoggedInUser();
    await waitFor(() => {
      expect(screen.getByText("My Real Set")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(1);
    const sampleQuizRow = screen.getByText("Sample Quiz").closest("div");
    expect(sampleQuizRow).toBeInTheDocument();
    expect(
      within(sampleQuizRow!).queryByRole("button", { name: /delete/i })
    ).toBeNull();
  });

  it("calls deleteDoc and removes set when Delete is clicked and user confirms", async () => {
    window.confirm = vi.fn(() => true);
    docMock.mockReturnValue("doc-ref" as never);

    renderWithLoggedInUser();
    await waitFor(() => {
      expect(screen.getByText("My Real Set")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith(
      'Delete "My Real Set"? This cannot be undone.'
    );
    await waitFor(() => {
      expect(deleteDocMock).toHaveBeenCalledWith("doc-ref");
    });
    expect(docMock).toHaveBeenCalledWith(
      expect.anything(),
      "questionSets",
      "set-1"
    );
    await waitFor(() => {
      expect(screen.queryByText("My Real Set")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Sample Quiz")).toBeInTheDocument();
  });

  it("does not call deleteDoc when user cancels confirm", async () => {
    window.confirm = vi.fn(() => false);

    renderWithLoggedInUser();
    await waitFor(() => {
      expect(screen.getByText("My Real Set")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteDocMock).not.toHaveBeenCalled();
    expect(screen.getByText("My Real Set")).toBeInTheDocument();
  });

  it("shows error and keeps set in list when delete fails", async () => {
    window.confirm = vi.fn(() => true);
    docMock.mockReturnValue("doc-ref" as never);
    deleteDocMock.mockRejectedValueOnce(new Error("Permission denied"));

    renderWithLoggedInUser();
    await waitFor(() => {
      expect(screen.getByText("My Real Set")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
    expect(screen.getByText("My Real Set")).toBeInTheDocument();
  });

  it("Create new quiz button navigates to /create", async () => {
    renderWithLoggedInUser();
    await waitFor(() => {
      expect(screen.getByText("My Question Sets")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /create new quiz/i }));
    expect(navigateMock).toHaveBeenCalledWith("/create");
  });

  it("Sign out button calls signOut and navigates to host-auth", async () => {
    signOutMock.mockResolvedValue(undefined as never);
    renderWithLoggedInUser();
    await waitFor(() => {
      expect(screen.getByText("My Question Sets")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledWith(expect.anything());
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/host-auth", {
        replace: true,
      });
    });
  });
});
