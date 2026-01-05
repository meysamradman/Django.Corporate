export class ApiError extends Error {
    response: {
        AppStatusCode: number;
        _data: unknown;
        ok: boolean;
        message: string;
        errors: Record<string, string[]> | null;
    };

    constructor(params: {
        response: {
            AppStatusCode: number;
            _data: unknown;
            ok: boolean;
            message?: string;
            errors: Record<string, string[]> | null;
        };
    }) {
        const safeMessage = params.response.message || `Error ${params.response.AppStatusCode}`;
        super(safeMessage);

        this.response = {
            ...params.response,
            message: safeMessage
        };
    }
}