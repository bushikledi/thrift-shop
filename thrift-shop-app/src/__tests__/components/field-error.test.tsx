/**
 * FieldError tests.
 *
 * Every form now reports validation through this one component, so the
 * "renders nothing when valid" case matters as much as the message itself —
 * a stray empty <p> would push layout around on every field.
 */
import { render, screen } from "@testing-library/react";
import { FieldError } from "@/components/forms/field-error";

describe("FieldError", () => {
  it("renders the message as an alert", () => {
    render(<FieldError error={{ message: "Price must be greater than 0" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Price must be greater than 0"
    );
  });

  it("renders nothing when there is no error", () => {
    const { container } = render(<FieldError />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the error carries no message", () => {
    const { container } = render(<FieldError error={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("exposes the id so an input can point at it with aria-describedby", () => {
    render(<FieldError error={{ message: "Required" }} id="email-error" />);
    expect(screen.getByRole("alert")).toHaveAttribute("id", "email-error");
  });
});
