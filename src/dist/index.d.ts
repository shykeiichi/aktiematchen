import type { HistoricalPricesOptions, HistoricalPricesResponse } from './types/historicalPrices';
import type { getSymbolResponse } from './types/getSymbol';
declare class YahooStockAPI {
    private frequencyList;
    private requestPool;
    getHistoricalPrices({ startDate, endDate, symbol, frequency }: HistoricalPricesOptions): Promise<APIresponse>;
    getTidyName(dirtyName: string): string;
    getSymbol({ symbol }: {
        symbol: string;
    }): Promise<APIresponse>;
    private getHistoricalPricesMapRows;
    private getSymbolMapRows;
    private handleError;
    private handleResponse;
    private parseCol1;
    private parseCol2;
}
interface SuccessResponse {
    error: false;
    response: HistoricalPricesResponse[] | getSymbolResponse;
    currency: string;
    name: string;
}
interface ErrorResponse {
    error: true;
    message: string | unknown;
}
type APIresponse = SuccessResponse | ErrorResponse;
export default YahooStockAPI;
