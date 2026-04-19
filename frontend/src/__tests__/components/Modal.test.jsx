import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/Modal';

describe('Modal Component', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(container.firstChild).toBe(null);
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.getByText('Modal Content')).toBeDefined();
  });

  it('should render title when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Title">
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByText('Test Title')).toBeDefined();
  });

  it('should not render header when hideHeader is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Title" hideHeader>
        <div>Content</div>
      </Modal>
    );
    expect(screen.queryByText('Test Title')).toBeNull();
  });

  it('should render action button when showActionBtn is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        showActionBtn={true}
        actionBtnText="Confirm"
        onActionBtnClick={vi.fn()}
      >
        <div>Content</div>
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeDefined();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onActionBtnClick when action button is clicked', () => {
    const handleAction = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        showActionBtn={true}
        actionBtnText="Confirm"
        onActionBtnClick={handleAction}
      >
        <div>Content</div>
      </Modal>
    );

    const actionButton = screen.getByText('Confirm');
    fireEvent.click(actionButton);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('should render children content', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Test Content</div>
        <p>Additional Content</p>
      </Modal>
    );
    expect(screen.getByText('Test Content')).toBeDefined();
    expect(screen.getByText('Additional Content')).toBeDefined();
  });
});
