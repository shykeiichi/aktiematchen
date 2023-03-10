"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/ban-ts-comment */
const undici_1 = require("undici");
const camelcase_1 = __importDefault(require("camelcase"));
const cheerio = __importStar(require("cheerio"));
const numeral_1 = __importDefault(require("numeral"));
const utils_1 = require("./utils");
class YahooStockAPI {
    frequencyList = ['1d', '1wk', '1mo'];
    requestPool = new undici_1.Pool('https://finance.yahoo.com');
    async getHistoricalPrices({ startDate, endDate, symbol, frequency }) {
        try {
            if (!startDate || Object.prototype.toString.call(startDate) !== '[object Date]')
                throw new Error('startDate not provided or not a "Date" type!');
            if (!endDate || Object.prototype.toString.call(startDate) !== '[object Date]')
                throw new Error('endDate not provided or not a "Date" type!');
            if (!symbol || typeof symbol !== 'string')
                throw new Error('Symbol not provided or Symbol is not a string!');
            if (!frequency || typeof frequency !== 'string' || !this.frequencyList.includes(frequency))
                throw new Error('Frequency should be "1d", "1wk" or "1mo"');
            const period1 = (0, utils_1.dateToUnix)(startDate);
            // pluis 1 day
            const period2 = (0, utils_1.dateToUnix)(endDate) + 86400;
            const request = await this.requestPool.request({
                method: 'GET',
                path: `/quote/${symbol}/history?period1=${period1}&period2=${period2}&interval=${frequency}&filter=history&frequency=${frequency}&includeAdjustedClose=true`,
            });
            const responseBody = await request.body.text();
            const $ = cheerio.load(responseBody);
            if ($('title').text() == 'Requested symbol wasn\'t found')
                throw new Error('Symbol not found!');
            let currency = $('#quote-header-info > div:nth-child(2) > div > div > span').text();
            currency = currency ? currency.split('.')[1].replace('Currency in', '').trim() : undefined;
            let name = this.getTidyName($('h1').text());
            const response = $('#Col1-1-HistoricalDataTable-Proxy > section > div:nth-child(2) > table > tbody > tr').map(this.getHistoricalPricesMapRows).get();
            return {
                error: false,
                currency: currency || undefined,
                name: name || undefined,
                response,
            };
        }
        catch (err) {
            return this.handleError(err);
        }
    }
    getTidyName(dirtyName) {
        let name = dirtyName;
        const regex = /^[^(]*/;
        return regex.exec(name)[0].substring(0, name.length - 2);
    }
    async getSymbol({ symbol }) {
        try {
            if (!symbol || typeof symbol !== 'string')
                throw new Error('Symbol not provided or Symbol is not a string!');
            const request = await this.requestPool.request({
                method: 'GET',
                path: `/quote/${symbol}/`,
            });
            const responseBody = await request.body.text();
            const $ = cheerio.load(responseBody);
            let currency = $('#quote-header-info > div:nth-child(2) > div > div > span').text();
            let name = this.getTidyName($('h1').text());
            currency = currency ? currency.split('.')[1].replace('Currency in', '').trim() : undefined;
            // @ts-ignore
            const col1 = $('#quote-summary > div.Pend\\(12px\\) > table > tbody').map(this.getSymbolMapRows).get()[0];
            // @ts-ignore
            const col2 = $('#quote-summary > div.Pstart\\(12px\\) > table > tbody').map(this.getSymbolMapRows).get()[0];
            return this.handleResponse({ updated: Date.now(), ...this.parseCol1(col1), ...this.parseCol2(col2) }, currency, name);
        }
        catch (err) {
            return this.handleError(err);
        }
    }
    getHistoricalPricesMapRows(_, row) {
        const obj = { date: null, open: null, high: null, low: null, close: null, adjClose: null, volume: null };
        const columns = ['date', 'open', 'high', 'low', 'close', 'adjClose', 'volume'];
        cheerio.load(row)('td').map((index, cell) => {
            cell = cheerio.load(cell);
            const selector = columns[index];
            switch (index) {
                case 0:
                    obj[selector] = new Date(cell.text()).getTime() / 1000;
                    break;
                default:
                    obj[selector] = (0, numeral_1.default)(cell.text()).value();
                    break;
            }
        });
        return obj;
    }
    getSymbolMapRows(_, row) {
        const json = {};
        const skipCheckColumn = ['marketCap', 'earningsDate', 'exDividendDate', 'bid', 'ask'];
        // eslint-disable-next-line no-shadow
        cheerio.load(row)('tr').each((_, cell) => {
            cell = cheerio.load(cell);
            const column = cell('td:nth-child(1)').text().replace('1y', 'oneYear').replace('52', 'fiftyTwo').replace(/\([^)]*\)|'s|&/g, '');
            const value = cell('td:nth-child(2)').text() !== 'N/A' ? cell('td:nth-child(2)').text() : null;
            // @ts-ignore
            json[(0, camelcase_1.default)(column)] = (0, numeral_1.default)(value).value() == null || isNaN((0, numeral_1.default)(value).value()) || skipCheckColumn.includes((0, camelcase_1.default)(column)) ? value : (0, numeral_1.default)(value).value();
        });
        return json;
    }
    handleError(error) {
        return {
            error: true,
            message: error instanceof Error ? error.message : error,
        };
    }
    handleResponse(response, currency, name) {
        if (!response)
            throw new Error('Response if not provided');
        return {
            error: false,
            currency: currency || undefined,
            name: name || undefined,
            response,
        };
    }
    parseCol1(Column1) {
        const json = {
            previousClose: 0,
            open: 0,
            bid: {
                value: 0,
                shares: 0,
            },
            ask: {
                value: 0,
                shares: 0,
            },
            dayRange: {
                low: 0,
                high: 0,
            },
            fiftyTwoWeekRange: {
                low: 0,
                high: 0,
            },
            volume: 0,
            avgVolume: 0,
        };
        Object.entries(Column1).forEach(([k, v], index) => {
            switch (index) {
                case 2:
                case 3: {
                    const [value, shares] = v.toString().split('x').map((val) => (0, numeral_1.default)(val.trim()).value());
                    // @ts-ignore
                    json[k]['value'] = value;
                    // @ts-ignore
                    json[k]['shares'] = shares;
                    break;
                }
                case 4:
                case 5: {
                    const [low, high] = v.toString().split('-').map((val) => (0, numeral_1.default)(val.trim()).value());
                    // @ts-ignore
                    json[k]['low'] = low;
                    // @ts-ignore
                    json[k]['high'] = high;
                    break;
                }
                default: {
                    // @ts-ignore
                    json[k] = (0, numeral_1.default)(v).value();
                }
            }
        });
        return json;
    }
    parseCol2(Column2) {
        const json = {
            marketCap: 0,
            beta: 0,
            peRatio: 0,
            eps: 0,
            earningsDate: {
                start: 0,
                end: 0,
            },
            forwardDividend: 0,
            forwardYield: 0,
            exDividendDate: 0,
            oneYearTargetEst: 0,
        };
        Object.entries(Column2).forEach(([k, v], index) => {
            switch (index) {
                case 0: {
                    // @ts-ignore
                    json.marketCap = (0, utils_1.convertMarketCap)(v);
                    break;
                }
                case 4: {
                    const [start, end] = v.toString().split('-').map((val) => (0, utils_1.dateToUnix)(val.trim()));
                    // @ts-ignore
                    json[k]['start'] = start;
                    // @ts-ignore
                    json[k]['end'] = end;
                    break;
                }
                case 5: {
                    const [fdividend, fyield] = v.toString().split(' ').map((val) => (0, numeral_1.default)(val.trim().replace('(', '').replace(')', '').replace('%', '')).value());
                    // @ts-ignore
                    json.forwardDividend = fdividend;
                    // @ts-ignore
                    json.forwardYield = fyield;
                    break;
                }
                case 6:
                    // @ts-ignore
                    json[k] = (0, utils_1.dateToUnix)(v);
                    break;
                default:
                    // @ts-ignore
                    json[k] = (0, numeral_1.default)(v).value();
                    break;
            }
        });
        return json;
    }
}
exports.default = YahooStockAPI;
