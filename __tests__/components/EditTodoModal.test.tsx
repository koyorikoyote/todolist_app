import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditTodoModal from '../../components/EditTodoModal';

describe('EditTodoModal Component', () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();
    const initialDescription = 'Test TODO description';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should render modal with initial description', () => {
        const { getByText, getByDisplayValue } = render(
            <EditTodoModal
                visible={true}
                initialDescription={initialDescription}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        expect(getByText('Edit TODO')).toBeTruthy();
        expect(getByDisplayValue(initialDescription)).toBeTruthy();
    });

    it('should call onSave with trimmed description', async () => {
        const { getByPlaceholderText, getByText } = render(
            <EditTodoModal
                visible={true}
                initialDescription={initialDescription}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        const input = getByPlaceholderText('Enter TODO description');
        fireEvent.changeText(input, '  Updated description  ');

        const saveButton = getByText('Save');
        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith('Updated description');
        });
    });

    it('should call onCancel when Cancel button is pressed', () => {
        const { getByText } = render(
            <EditTodoModal
                visible={true}
                initialDescription={initialDescription}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        const cancelButton = getByText('Cancel');
        fireEvent.press(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error for empty description', async () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <EditTodoModal
                visible={true}
                initialDescription={initialDescription}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        const input = getByPlaceholderText('Enter TODO description');
        fireEvent.changeText(input, '   ');

        const saveButton = getByText('Save');
        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(queryByText('Description cannot be empty')).toBeTruthy();
        });

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when description exceeds 500 characters', async () => {
        const longDescription = 'a'.repeat(501);
        const { getByPlaceholderText, getByText, queryByText } = render(
            <EditTodoModal
                visible={true}
                initialDescription={initialDescription}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        const input = getByPlaceholderText('Enter TODO description');
        fireEvent.changeText(input, longDescription);

        const saveButton = getByText('Save');
        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(queryByText('Description cannot exceed 500 characters')).toBeTruthy();
        });

        expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear error when valid text is entered', async () => {
        const { getByPlaceholderText, getByText, queryByText } = render(
            <EditTodoModal
                visible={true}
                initialDescription={initialDescription}
                onSave={mockOnSave}
                onCancel={mockOnCancel}
            />
        );

        const input = getByPlaceholderText('Enter TODO description');
        fireEvent.changeText(input, '');

        const saveButton = getByText('Save');
        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(queryByText('Description cannot be empty')).toBeTruthy();
        });

        fireEvent.changeText(input, 'Valid description');

        await waitFor(() => {
            expect(queryByText('Description cannot be empty')).toBeNull();
        });
    });
});
