import React from "react";
import { render, fireEvent, act } from "@testing-library/react";
import { UInbox } from "./index"; // Update the path based on your folder structure
import "@testing-library/jest-dom/extend-expect";
jest.mock("@xmtp/react-sdk", () => ({
  Client: {
    create: jest.fn(),
  },
}));

describe("<UInbox />", () => {
  it("opens when window.uinbox.open() is called", () => {
    render(<UInbox />);

    act(() => {
      // Simulate the calling of the open method
      window.uinbox.open();
    });

    // Your assertion code to check if UInbox has opened
    // This may vary depending on how the open state is handled in your component
  });

  it("closes when window.uinbox.close() is called", () => {
    render(<UInbox />);

    act(() => {
      // Simulate the calling of the close method
      window.uinbox.close();
    });

    // Your assertion code to check if UInbox has closed
    // This may vary depending on how the close state is handled in your component
  });
});
