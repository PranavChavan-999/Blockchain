/**
 * openUGF() from @tychilabs/react-ugf opens the modal and resolves without a value.
 * The payment result is published on context `result` after the user confirms.
 */

export function ugfResultTxHash(result) {
  if (!result) return null;
  const h = result.txHash ?? result.hash ?? result.userTxHash;
  return h ? String(h).toLowerCase() : null;
}

export function waitForNewUgfResult(getResult, previousResult, options = {}) {
  const { timeoutMs = 300000, intervalMs = 250 } = options;
  const previousHash = ugfResultTxHash(previousResult);

  return new Promise((resolve, reject) => {
    const started = Date.now();

    const tick = () => {
      const current = getResult();
      const currentHash = ugfResultTxHash(current);
      const isNewResult =
        current &&
        currentHash &&
        (!previousHash || currentHash !== previousHash);

      if (isNewResult) {
        resolve(current);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(
          new Error(
            "UGF payment was not completed. Confirm payment in the UGF modal, or close it and try again."
          )
        );
        return;
      }
      setTimeout(tick, intervalMs);
    };

    tick();
  });
}
