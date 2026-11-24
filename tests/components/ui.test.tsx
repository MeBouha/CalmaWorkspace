/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomCard } from "@/components/RoomCard";
import { RegisterForm } from "@/components/RegisterForm";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));

describe("RoomCard", () => {
  it("shows name, French type, capacity and equipment chips", () => {
    render(<RoomCard room={{ name: "Salle Réunion A", type: "MEETING", capacity: 8, equipment: ["projecteur", "visio"] }} />);
    expect(screen.getByRole("heading", { name: "Salle Réunion A" })).toBeInTheDocument();
    expect(screen.getByText("Réunion")).toBeInTheDocument();
    expect(screen.getByText("Capacité : 8 personnes")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Équipements" }).children).toHaveLength(2);
  });
});

describe("RegisterForm", () => {
  it("shows a mismatch error without calling the API", async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Mot de passe"), "Password1");
    await userEvent.type(screen.getByLabelText("Confirmer le mot de passe"), "Password2");
    await userEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));
    expect(await screen.findByText("Les mots de passe ne correspondent pas.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("offers the four client profiles in French", () => {
    render(<RegisterForm />);
    for (const label of ["Étudiant", "Élève", "Développeur", "Entrepreneur"]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });
});
