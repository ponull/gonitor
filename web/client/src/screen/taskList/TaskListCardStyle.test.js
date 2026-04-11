import {render, waitFor} from "@testing-library/react";
import {TaskListCardStyle} from "./TaskListCardStyle";

describe("TaskListCardStyle", () => {
    it("renders skeleton placeholders while loading", async () => {
        const {container} = render(
            <TaskListCardStyle
                loading={true}
                taskList={[]}
                showConfirmDeleteDialog={jest.fn()}
                showEditDialog={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(container.querySelectorAll(".MuiSkeleton-root").length).toBeGreaterThan(0);
        });
    });
});
