import {render, screen} from "@testing-library/react";
import {SnackbarProvider} from "notistack";
import {NodeList} from "./NodeList";
import httpRequest from "../../common/request/HttpRequest";

jest.mock("../../common/request/HttpRequest", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    }
}));

describe("NodeList states", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows an empty state when there are no edge nodes", async () => {
        httpRequest.get.mockResolvedValue({code: 0, data: []});

        render(
            <SnackbarProvider>
                <NodeList/>
            </SnackbarProvider>
        );

        expect(await screen.findByText("当前还没有边缘节点，您可以先手动添加节点或使用一键部署创建新节点。")).toBeInTheDocument();
    });

    it("shows an error state when loading nodes fails", async () => {
        httpRequest.get.mockResolvedValue({code: 500, message: "节点加载失败"});

        render(
            <SnackbarProvider>
                <NodeList/>
            </SnackbarProvider>
        );

        expect((await screen.findAllByText("节点加载失败")).length).toBeGreaterThan(0);
        expect(screen.getByRole("button", {name: "重试"})).toBeInTheDocument();
    });
});
