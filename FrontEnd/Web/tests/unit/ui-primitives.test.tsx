import * as React from "react";
import { describe, it, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  SkeletonText,
} from "@/components/ui";

describe("UI Primitives (src/components/ui/*)", () => {
  describe("Button", () => {
    it("renders with text and handles click event", () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("disables button and shows spinner when isLoading is true", () => {
      const handleClick = jest.fn();
      render(
        <Button isLoading loadingText="Processing..." onClick={handleClick}>
          Submit
        </Button>
      );

      const button = screen.getByRole("button", { name: /processing/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("renders leftIcon and rightIcon", () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Action
        </Button>
      );

      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });

  describe("Input", () => {
    it("renders label, placeholder, and updates value", () => {
      const handleChange = jest.fn();
      render(
        <Input
          label="Email Address"
          placeholder="user@example.com"
          onChange={handleChange}
        />
      );

      expect(screen.getByText("Email Address")).toBeInTheDocument();
      const input = screen.getByPlaceholderText("user@example.com");
      fireEvent.change(input, { target: { value: "test@example.com" } });
      expect(handleChange).toHaveBeenCalled();
    });

    it("displays error message and marks input as aria-invalid", () => {
      render(
        <Input
          label="Password"
          error="Password must be at least 8 characters"
        />
      );

      const errorMessage = screen.getByText("Password must be at least 8 characters");
      expect(errorMessage).toBeInTheDocument();
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("toggles password visibility when isPassword is true", () => {
      render(<Input label="Password" isPassword defaultValue="secret123" />);

      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");

      const toggleButton = screen.getByRole("button", { name: /show password/i });
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute("type", "text");

      const hideButton = screen.getByRole("button", { name: /hide password/i });
      fireEvent.click(hideButton);
      expect(input).toHaveAttribute("type", "password");
    });

    it("handles clearable button callback", () => {
      const handleClear = jest.fn();
      render(
        <Input
          label="Search"
          value="cleaning service"
          clearable
          onClear={handleClear}
          onChange={() => {}}
        />
      );

      const clearBtn = screen.getByRole("button", { name: /clear input value/i });
      fireEvent.click(clearBtn);
      expect(handleClear).toHaveBeenCalledTimes(1);
    });
  });

  describe("Select", () => {
    const mockOptions = [
      { value: "plumbing", label: "Plumbing" },
      { value: "electrical", label: "Electrical" },
    ];

    it("renders options from options array", () => {
      render(
        <Select
          label="Service Category"
          placeholder="Select a category"
          options={mockOptions}
        />
      );

      expect(screen.getByText("Service Category")).toBeInTheDocument();
      expect(screen.getByText("Plumbing")).toBeInTheDocument();
      expect(screen.getByText("Electrical")).toBeInTheDocument();
    });

    it("triggers onChange on selection", () => {
      const handleChange = jest.fn();
      render(
        <Select
          label="Category"
          options={mockOptions}
          onChange={handleChange}
        />
      );

      const select = screen.getByLabelText("Category");
      fireEvent.change(select, { target: { value: "electrical" } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Badge", () => {
    it("renders badge text with status dot", () => {
      render(
        <Badge variant="success" dot>
          Active
        </Badge>
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("calls onRemove when remove button is clicked", () => {
      const handleRemove = jest.fn();
      render(
        <Badge variant="primary" onRemove={handleRemove}>
          Filter Tag
        </Badge>
      );

      const removeBtn = screen.getByRole("button", { name: /remove badge/i });
      fireEvent.click(removeBtn);
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    it("renders design token contract badges", () => {
      render(<Badge variant="contract">Fixed Contract</Badge>);
      expect(screen.getByText("Fixed Contract")).toBeInTheDocument();
    });
  });

  describe("Modal", () => {
    it("renders nothing when isOpen is false", () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          Modal Content
        </Modal>
      );

      expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
    });

    it("renders dialog contents and fires onClose when close button clicked", () => {
      const handleClose = jest.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Booking Confirmation"
          description="Review details"
        >
          <p>Confirm booking request?</p>
        </Modal>
      );

      expect(screen.getByText("Booking Confirmation")).toBeInTheDocument();
      expect(screen.getByText("Confirm booking request?")).toBeInTheDocument();

      const closeButton = screen.getByRole("button", { name: /close modal/i });
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape key press", () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("renders compound components ModalHeader, ModalBody, ModalFooter", () => {
      render(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
          <ModalHeader>
            <h2>Header Title</h2>
          </ModalHeader>
          <ModalBody>
            <p>Body Content</p>
          </ModalBody>
          <ModalFooter>
            <Button>Confirm</Button>
          </ModalFooter>
        </Modal>
      );

      expect(screen.getByText("Header Title")).toBeInTheDocument();
      expect(screen.getByText("Body Content")).toBeInTheDocument();
      expect(screen.getByText("Confirm")).toBeInTheDocument();
    });
  });

  describe("Skeleton", () => {
    it("renders rectangular skeleton placeholder with aria-hidden", () => {
      const { container } = render(<Skeleton width={200} height={40} />);
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute("aria-hidden", "true");
    });

    it("renders circular skeleton for avatars", () => {
      const { container } = render(
        <Skeleton variant="circular" className="h-12 w-12" />
      );
      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("renders multiple lines with SkeletonText", () => {
      const { container } = render(<SkeletonText lines={4} />);
      expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4);
    });
  });
});
