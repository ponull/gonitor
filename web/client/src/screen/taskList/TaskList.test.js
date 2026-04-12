import {render, screen} from "@testing-library/react";
import {SnackbarProvider} from "notistack";
import {TaskList} from "./TaskList";
import httpRequest from "../../common/request/HttpRequest";

jest.mock("../../common/request/HttpRequest", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        delete: jest.fn(),
    }
}));

jest.mock("../../common/utils/hook", () => ({
    useScreenSize: () => ({isDesktop: true}),
}));

jest.mock("./TaskAdd", () => ({
    TaskAdd: require("react").forwardRef(() => null),
}));

jest.mock("./TaskEdit", () => ({
    TaskEdit: require("react").forwardRef(() => null),
}));

jest.mock("./TaskListTableStyle", () => ({
    TaskListTableStyle: () => <div data-testid="task-list-table">task table</div>,
}));

jest.mock("./TaskListCardStyle", () => ({
    TaskListCardStyle: () => <div data-testid="task-list-card">task cards</div>,
}));

describe("TaskList states", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows an empty state when there are no tasks", async () => {
        httpRequest.get.mockResolvedValue({code: 0, data: []});

        render(
            <SnackbarProvider>
                <TaskList/>
            </SnackbarProvider>
        );

        expect(await screen.findByText("No tasks yet. Create your first task to get started.")).toBeInTheDocument();
        expect(screen.queryByTestId("task-list-table")).not.toBeInTheDocument();
    });

    it("shows an error state when loading fails", async () => {
        httpRequest.get.mockResolvedValue({code: 500, message: "load failed"});

        render(
            <SnackbarProvider>
                <TaskList/>
            </SnackbarProvider>
        );

        expect(await screen.findByText("load failed")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Retry"})).toBeInTheDocument();
    });
});
