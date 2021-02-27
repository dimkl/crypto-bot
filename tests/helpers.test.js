const {
    convertCurrencyToISO4217,
    getChangePercentage,
    handleErrorResponse,
    hasDecreasedFor,
    hasIncreasedFor,
    intervalSeconds,
    isLive,
    makePercentage,
    makeModeConfig,
    sliceObject,
    splitCurrencies,
} = require('../src/helpers');

describe('helpers', () => {
    describe('convertCurrencyToISO4217(currencyPair)', () => {
        test('converts currencyPair to upper case and adds / between currencies', () => {
            expect(convertCurrencyToISO4217('xlmeur')).toBe('XLM/EUR');
            expect(convertCurrencyToISO4217('XLMeur')).toBe('XLM/EUR');
            expect(convertCurrencyToISO4217('xlmEUR')).toBe('XLM/EUR');
        });

        describe('when already in ISO 4217 format', () => {
            test('returns the same', () => {
                expect(convertCurrencyToISO4217('XLM/EUR')).toBe('XLM/EUR');
            })
        })
    });

    describe('getChangePercentage(initial, current)', () => {
        describe('when current value increased', () => {
            test('returns positive increased percentage', () => {
                const initial = '0.3784';
                const percent = '0.0250';
                const current = initial * '1.0250';

                expect(getChangePercentage(initial, current)).toBe(percent);
            });
        });

        describe('when current value decreased', () => {
            test.skip('returns negative decreased percentage', () => {
                const current = '0.3784';
                const percent = '-0.0250';
                const initial = current * '1.0250';

                expect(getChangePercentage(initial, current)).toEqual(percent);
            });
        });

        describe('when current value unchanged', () => {
            test('returns zero', () => {
                expect(getChangePercentage('0.37840', '0.37840')).toEqual("0.0000");
            });
        });
    });

    describe.skip('handleErrorResponse(err)', () => {

    });

    describe('hasDecreasedFor(current, initial, percent)', () => {
        describe('when increased percentage reached', () => {
            test('returns true', () => {
                const initial = '0.37840';
                const percent = '0.0250';
                const current = initial * '0.9750';

                expect(hasDecreasedFor(current, initial, percent)).toBe(true);
            });
        });
    });

    describe('hasIncreasedFor(current, initial, percent)', () => {
        describe('when increased percentage reached', () => {
            test('returns true', () => {
                const initial = '0.37840';
                const percent = '0.0250';
                const current = initial * '1.0250';

                expect(hasIncreasedFor(current, initial, percent)).toBe(true);
            });
        });
    });

    describe('intervalSeconds(seconds)', () => {
        test('convert seconds to miliseconds', () => {
            expect(intervalSeconds(1)).toBe(1000);
            expect(intervalSeconds(5)).toBe(5000);
            expect(intervalSeconds(5.3)).toBe(5300);
        });
    });

    describe('isLive()', () => {
        beforeEach(() => {
            this.nodeEnv = process.env.NODE_ENV;
        });

        afterEach(() => {
            if (this.nodeEnv) {
                process.env.NODE_ENV = this.nodeEnv;
            } else {
                delete process.env.NODE_ENV;
            }
        })

        describe('when NODE_ENV is development', () => {
            test('returns false', () => {
                process.env.NODE_ENV = 'development';
                expect(isLive()).toBe(false);
            });
        });

        describe('when NODE_ENV is test', () => {
            test('returns false', () => {
                process.env.NODE_ENV = 'test';
                expect(isLive()).toBe(false);
            });
        });

        describe('when NODE_ENV is production', () => {
            test('returns true', () => {
                process.env.NODE_ENV = 'production';
                expect(isLive()).toBe(true);
            });
        });

        describe('when NODE_ENV is empty', () => {
            test('returns true', () => {
                delete process.env.NODE_ENV;
                expect(isLive()).toBe(true);
            });
        });

        describe('when NODE_ENV is custom', () => {
            test('returns false', () => {
                process.env.NODE_ENV = 'yolo';
                expect(isLive()).toBe(false);
            });
        });
    });

    describe('makePercentage(number)', () => {
        test('returns number as percentage with 4 decimals', () => {
            expect(makePercentage(0.05)).toBe('0.0005');
            expect(makePercentage(0.2)).toBe('0.0020');
            expect(makePercentage(1)).toBe('0.0100');
            expect(makePercentage(20)).toBe('0.2000');
            expect(makePercentage(100)).toBe('1.0000');
        })
    });

    describe('makeModeConfig(trade, change, comeback)', () => {
        test('construct object with percentages for trade, change, comeback values', () => {
            expect(makeModeConfig(99, 5, 1.5)).toMatchObject({
                tradePercentage: '0.9900',
                changePercentage: '0.0500',
                comebackPercentage: '0.0150'
            });
        });
    });

    describe('sliceObject(object, keys)', () => {
        test('returns object with the only the specified keys', () => {
            expect(sliceObject({ a: 1, b: 2 }, ['b'])).toEqual({ b: 2 });
        });
    });

    describe('splitCurrencies(currencyPair)', () => {
        test('splits currency to 2 currencies', () => {
            expect(splitCurrencies('xlmeur')).toEqual(['xlm', 'eur']);
            expect(splitCurrencies('XLMeur')).toEqual(['XLM', 'eur']);
            expect(splitCurrencies('xlmEUR')).toEqual(['xlm', 'EUR']);
        });

        describe('when currencyPair in ISO 4217', () => {
            test('splits currency to 2 currencies', () => {
                expect(splitCurrencies('XLM/EUR')).toEqual(['XLM', 'EUR']);
            });
        })
    });
});
