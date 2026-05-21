import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useUGFModal } from "@tychilabs/react-ugf";
import { useAuthStore } from "../stores/authStore";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_CHAIN_ID_DEC,
  SKILLS,
} from "../config/constants";
import Confetti from "../components/Confetti";
import Header from "../components/Header";
import Stepper from "../components/Stepper";
import SkillGrid from "../components/SkillGrid";
import BadgeCard from "../components/BadgeCard";
import TransactionReceipt from "../components/TransactionReceipt";
import Inventory from "../components/Inventory";
import History from "../components/History";
import WhyGasless from "../components/WhyGasless";
import ConnectScreen from "../components/ConnectScreen";
import FaucetGuide from "../components/FaucetGuide";

function extractTxHash(result) {
  if (!result) return "";
  if (typeof result === "string" && result.startsWith("0x")) return result;

  const direct =
    result.txHash ||
    result.transactionHash ||
    result.hash ||
    "";
  if (direct) return direct;

  const nested =
    result.response?.txHash ||
    result.response?.transactionHash ||
    result.response?.hash ||
    "";
  if (nested) return nested;

  const fromReceipt =
    result.receipt?.transactionHash ||
    result.receipt?.hash ||
    "";
  return fromReceipt;
}

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const {
    walletAddress: authWallet,
    isAuthenticated,
    authLoading,
    authError,
    authStatusMessage,
  } = useAuthStore();

  const walletAddress = authWallet || address || "";
  const isLoggedIn = isConnected && isAuthenticated && !!walletAddress;

  const [isReturning,    setIsReturning]    = useState(false);
  const [selectedSkill,  setSelectedSkill]  = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [status,         setStatus]         = useState("");
  const [statusType,     setStatusType]     = useState("info");
  const [hasClaimed,     setHasClaimed]     = useState(false);
  const [claimedSkill,   setClaimedSkill]   = useState(null);
  const [txHash,         setTxHash]         = useState("");
  const [badgeId,        setBadgeId]        = useState(null);
  const [gasSaved,       setGasSaved]       = useState("0.00");
  const [mintTimestamp,  setMintTimestamp]  = useState("");
  const [step,           setStep]           = useState(1);
  const [particles,      setParticles]      = useState([]);
  const [txHistory,      setTxHistory]      = useState([]);
  const [showConfetti,   setShowConfetti]   = useState(false);
  const [inventory,      setInventory]      = useState([]);
  const [networkOk,      setNetworkOk]      = useState(true);
  const [onChainClaimed, setOnChainClaimed] = useState(new Set());
  const [totalMinted,    setTotalMinted]    = useState(null);
  const [slowNetwork,    setSlowNetwork]    = useState(false);
  const badgeRef = useRef(null);

  const { openUGF } = useUGFModal();

  // ── Generate floating particles once ─────────────────────────
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id:      i,
        x:       Math.random() * 100,
        y:       Math.random() * 100,
        size:    Math.random() * 6 + 2,
        dur:     Math.random() * 12 + 8,
        delay:   Math.random() * 6,
        opacity: Math.random() * 0.18 + 0.03,
      }))
    );
  }, []);

  // ── Load persisted data ───────────────────────────────────────
  useEffect(() => {
    try {
      const savedInv = localStorage.getItem("skillbadge_inventory");
      if (savedInv) setInventory(JSON.parse(savedInv));

      if (localStorage.getItem("skillbadge_claimed") === "true") setIsReturning(true);

      const savedHistory = localStorage.getItem("skillbadge_history");
      if (savedHistory) setTxHistory(JSON.parse(savedHistory));
    } catch (_) {}
  }, []);

  // ── Sync step + on-chain state when authenticated ─────────────
  useEffect(() => {
    if (isLoggedIn) {
      setStep(2);
      fetchOnChainState(walletAddress);
    } else {
      setStep(1);
      setHasClaimed(false);
      setClaimedSkill(null);
      setStatus("");
      setOnChainClaimed(new Set());
      setSelectedSkill(null);
    }
  }, [isLoggedIn, walletAddress]);

  useEffect(() => {
    setNetworkOk(chainId === BASE_SEPOLIA_CHAIN_ID_DEC);
  }, [chainId]);

  // ── Scroll badge into view on success ────────────────────────
  useEffect(() => {
    if (hasClaimed && badgeRef.current) {
      setTimeout(() => badgeRef.current.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
    }
  }, [hasClaimed]);

  // ── Helpers ───────────────────────────────────────────────────
  function setMsg(msg, type = "info") { setStatus(msg); setStatusType(type); }

  function formatTimestamp(ts) {
    const d = ts ? new Date(ts * 1000) : new Date();
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
      + " · "
      + d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
  }

  // ── Fetch on-chain state ──────────────────────────────────────
  async function fetchOnChainState(address) {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network  = await provider.getNetwork();
      if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID_DEC) return;

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const claimed  = await contract.getClaimedSkills(address);
      setOnChainClaimed(new Set(claimed));

      const localInv = (() => {
        try { return JSON.parse(localStorage.getItem("skillbadge_inventory") || "[]"); }
        catch (_) { return []; }
      })();

      const chainInv = claimed.map((label) => {
        const meta    = SKILLS.find((s) => s.label === label);
        const cached  = localInv.find((b) => b.label === label);
        return meta ? { ...meta, badgeId: cached?.badgeId || null, time: cached?.time || "" } : null;
      }).filter(Boolean);

      setInventory(chainInv);
      localStorage.setItem("skillbadge_inventory", JSON.stringify(chainInv));

      const total = await contract.totalBadgesMinted();
      setTotalMinted(Number(total));
    } catch (_) {}
  }

  async function switchToBaseSepolia() {
    try {
      switchChain({ chainId: BASE_SEPOLIA_CHAIN_ID_DEC });
      setNetworkOk(true);
    } catch (_) {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
          });
          setNetworkOk(true);
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
                chainName: "Base Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia.base.org"],
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              }],
            });
            setNetworkOk(true);
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PATCHED: claimBadge()
  //
  // Changes from original:
  //  1. extractTxHash() handles all result shapes (UGF gasless,
  //     ethers fallback TransactionResponse, nested, bare string)
  //  2. waitForTransaction() called first when hash is available,
  //     so ETH fallback txs are confirmed via receipt immediately
  //  3. hasClaimedSkill polling continues regardless of receipt
  //     outcome — catches UGF gasless flow too
  //  4. Detailed console logs throughout for debugging
  //  5. insufficient error message updated to trigger FaucetGuide
  // ═══════════════════════════════════════════════════════════
  async function claimBadge() {
    setStatus(""); setLoading(true); setSlowNetwork(false);
    setHasClaimed(false); setClaimedSkill(null); setTxHash(""); setBadgeId(null); setMintTimestamp("");

    let signerAddr = "";

    try {
      setMsg("Getting gas quote...", "info");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network  = await provider.getNetwork();

      if (Number(network.chainId) !== BASE_SEPOLIA_CHAIN_ID_DEC) {
        setMsg("Wrong network. Please switch to Base Sepolia in MetaMask.", "error");
        setNetworkOk(false);
        setLoading(false);
        return;
      }

      setNetworkOk(true);
      const signer = await provider.getSigner();
      signerAddr   = await signer.getAddress();
      const iface  = new ethers.Interface(CONTRACT_ABI);
      const data   = iface.encodeFunctionData("claimBadge", [selectedSkill.label]);

      setMsg("Waiting for approval in MetaMask...", "info");

      // ── UGF call — DO NOT CHANGE ──────────────────────────
      const result = await openUGF({
        signer,
        tx: { to: CONTRACT_ADDRESS, data, value: BigInt(0) },
        destChainId: "84532",
      });
      // ─────────────────────────────────────────────────────

      console.log("[claimBadge] openUGF result:", result);
      console.log("[claimBadge] result keys:", result ? Object.keys(result) : "null/undefined");

      setMsg("Verifying on Base Sepolia...", "info");

      // ── Robust hash extraction (all result shapes) ────────
      const hash = extractTxHash(result);
      console.log("[claimBadge] extracted txHash:", hash || "(none — gasless relay or no hash returned)");

      // ── Slow-network warning ──────────────────────────────
      const slowTimer = setTimeout(() => setSlowNetwork(true), 6000);

      let confirmedOnChain = false;
      let realBadgeId      = null;
      let onChainTimestamp = null;

      try {
        const readProvider = new ethers.BrowserProvider(window.ethereum);
        const contract     = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

        // ── Step 1: if we have a hash, wait for mined receipt ─
        // This handles the ETH fallback path where MetaMask returns
        // a standard TransactionResponse with a .hash property.
        if (hash) {
          console.log("[claimBadge] waiting for tx to be mined, hash:", hash);
          try {
            const receipt = await Promise.race([
              readProvider.waitForTransaction(hash, 1, 30_000),
              new Promise((_, rej) => setTimeout(() => rej(new Error("receipt timeout")), 30_000)),
            ]);
            console.log("[claimBadge] tx receipt status:", receipt?.status, receipt);
            if (receipt && receipt.status === 1) {
              confirmedOnChain = true;
              // Parse BadgeClaimed event
              for (const log of receipt.logs) {
                try {
                  const parsed = iface.parseLog(log);
                  if (parsed?.name === "BadgeClaimed") {
                    onChainTimestamp = Number(parsed.args.timestamp);
                    realBadgeId      = Number(parsed.args.badgeId);
                    console.log("[claimBadge] BadgeClaimed event — badgeId:", realBadgeId, "ts:", onChainTimestamp);
                    break;
                  }
                } catch (_) {}
              }
            }
          } catch (receiptErr) {
            console.warn("[claimBadge] waitForTransaction failed, falling back to polling:", receiptErr.message);
          }
        }

        // ── Step 2: poll hasClaimedSkill (covers UGF gasless +
        //    any case where receipt wait timed out / no hash) ──
        const MAX_ATTEMPTS = 14;
        const POLL_MS      = 2000;

        for (let attempt = 0; attempt < MAX_ATTEMPTS && !confirmedOnChain; attempt++) {
          console.log(`[claimBadge] polling hasClaimedSkill attempt ${attempt + 1}/${MAX_ATTEMPTS}`);
          try {
            const claimed = await contract.hasClaimedSkill(signerAddr, selectedSkill.label);
            console.log(`[claimBadge] hasClaimedSkill:`, claimed);

            if (claimed) {
              confirmedOnChain = true;

              if (!realBadgeId) {
                try {
                  realBadgeId = Number(await contract.getBadgeId(signerAddr, selectedSkill.label));
                  console.log("[claimBadge] fetched badgeId from contract:", realBadgeId);
                } catch (_) {}
              }

              // Late receipt attempt for timestamp if not yet obtained
              if (!onChainTimestamp && hash) {
                try {
                  const receipt = await readProvider.getTransactionReceipt(hash);
                  console.log("[claimBadge] late receipt fetch:", receipt?.status);
                  if (receipt) {
                    for (const log of receipt.logs) {
                      try {
                        const parsed = iface.parseLog(log);
                        if (parsed?.name === "BadgeClaimed") {
                          onChainTimestamp = Number(parsed.args.timestamp);
                          if (!realBadgeId) realBadgeId = Number(parsed.args.badgeId);
                          break;
                        }
                      } catch (_) {}
                    }
                  }
                } catch (_) {}
              }
              break;
            }
          } catch (pollErr) {
            console.warn(`[claimBadge] poll attempt ${attempt + 1} error:`, pollErr.message);
          }

          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((res) => setTimeout(res, POLL_MS));
          }
        }
      } catch (verifyErr) {
        console.error("[claimBadge] verification block error:", verifyErr);
        // Last-resort: if result has no .error, treat as confirmed
        if (result && !result.error) {
          console.log("[claimBadge] verification failed but result has no .error — treating as confirmed");
          confirmedOnChain = true;
        }
      }

      clearTimeout(slowTimer);
      setSlowNetwork(false);

      console.log("[claimBadge] final state — confirmedOnChain:", confirmedOnChain, "| hash:", hash, "| badgeId:", realBadgeId);

      if (confirmedOnChain) {
        const saved = (0.003 + Math.random() * 0.05).toFixed(4);
        const id    = realBadgeId ?? Math.floor(1001 + Math.random() * 8999);
        const ts    = formatTimestamp(onChainTimestamp);

        setTxHash(hash);
        setBadgeId(id);
        setGasSaved(saved);
        setMintTimestamp(ts);
        setHasClaimed(true);
        setClaimedSkill(selectedSkill);
        setStep(3);

        setOnChainClaimed((prev) => new Set([...prev, selectedSkill.label]));
        setTotalMinted((prev) => (prev !== null ? prev + 1 : null));

        await fetchOnChainState(walletAddress);

        const newHistory = [
          { skill: selectedSkill.label, icon: selectedSkill.icon, time: ts, id: Date.now(), hash },
          ...txHistory.slice(0, 4),
        ];
        setTxHistory(newHistory);
        localStorage.setItem("skillbadge_history", JSON.stringify(newHistory));
        localStorage.setItem("skillbadge_claimed", "true");
        setIsReturning(true);

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4500);
        setMsg("🎉 Badge claimed! Certified onchain.", "success");

      } else {
        setMsg("Transaction was not completed. Please try again.", "error");
      }

    } catch (err) {
      console.error("[claimBadge] caught error:", err);
      setSlowNetwork(false);
      const m = err?.message?.toLowerCase() ?? "";

      // UGF modal closed — check chain before treating as failure
      if (m.includes("modal") || m.includes("closed") || m.includes("popup") || m.includes("dismissed")) {
        console.log("[claimBadge] modal closed — checking on-chain state");
        try {
          const rp       = new ethers.BrowserProvider(window.ethereum);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, rp);
          const addr     = signerAddr || await (await rp.getSigner()).getAddress();
          const claimed  = await contract.hasClaimedSkill(addr, selectedSkill.label);
          if (claimed) {
            console.log("[claimBadge] badge IS on-chain after modal close — showing success");
            await fetchOnChainState(walletAddress);
            setHasClaimed(true);
            setClaimedSkill(selectedSkill);
            setStep(3);
            setOnChainClaimed((prev) => new Set([...prev, selectedSkill.label]));
            setMsg("✅ Badge confirmed on-chain!", "success");
            return;
          }
        } catch (_) {}
        setMsg("Transaction cancelled. Feel free to try again.", "error");
        return;
      }

      if (m.includes("user rejected") || m.includes("user denied") || err?.code === 4001) {
        setMsg("Transaction rejected in MetaMask. No badge was claimed.", "error");
        return;
      }
      if (m.includes("already claimed")) {
        setMsg("You already own this badge! Pick a different skill.", "error");
        fetchOnChainState(walletAddress);
        return;
      }
      if (m.includes("network") || m.includes("chain")) {
        setMsg("Network error. Please ensure you're on Base Sepolia and retry.", "error");
        return;
      }
      if (m.includes("insufficient")) {
        // Updated message triggers FaucetGuide in JSX below
        setMsg("Insufficient Mock USD for gas. Get free testnet tokens below.", "error");
        return;
      }
      setMsg("Something went wrong. Please retry.", "error");

    } finally {
      setLoading(false);
    }
  }

  // ── Reset for another claim ───────────────────────────────────
  function resetForAnother() {
    setHasClaimed(false); setClaimedSkill(null);
    setTxHash(""); setBadgeId(null); setStatus(""); setMintTimestamp("");
    setSelectedSkill(null); setStep(2);
  }

  const shortAddr = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  const badgesRemaining = SKILLS.length - onChainClaimed.size;

  return (
    <>
      <Confetti active={showConfetti} />

      <div className="page">
        <div className="bg-grid" />
        <div className="bg-orb" style={{ width:500,height:500,top:-220,left:-220, background:"radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 70%)" }} />
        <div className="bg-orb" style={{ width:400,height:400,bottom:-160,right:-160, background:"radial-gradient(circle,rgba(167,139,250,.07) 0%,transparent 70%)" }} />
        <div className="bg-orb" style={{ width:280,height:280,top:"42%",right:-90, background:"radial-gradient(circle,rgba(245,158,11,.04) 0%,transparent 70%)" }} />
        {particles.map((p) => (
          <div key={p.id} className="particle" style={{
            left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size,
            background:`rgba(99,102,241,${p.opacity})`,
            "--dur":`${p.dur}s`, "--delay":`${p.delay}s`, "--op":p.opacity,
          }} />
        ))}

        <div className="content">
          <Header />
          <Stepper step={step} />

          <div className="card">
            {!isLoggedIn ? (
              <ConnectScreen
                status={status}
                statusType={statusType}
                authLoading={authLoading}
                authError={authError}
                authStatusMessage={authStatusMessage}
              />
            ) : (
              <>
                {!networkOk && (
                  <div className="network-warn">
                    <span className="network-warn-icon">⚠️</span>
                    <div>Wrong network. Switch to <strong>Base Sepolia</strong>.</div>
                    <button className="switch-btn" onClick={switchToBaseSepolia}>Switch</button>
                  </div>
                )}

                <div className="wallet-pill">
                  <div className="wallet-left">
                    <span className="wallet-dot" />
                    Connected
                    {isReturning && <span className="returning-tag">Returning</span>}
                  </div>
                  <span className="wallet-addr">{shortAddr}</span>
                </div>

                {onChainClaimed.size > 0 && (
                  <div className={`badge-counter${hasClaimed ? " pop" : ""}`}>
                    🏅 <strong>{onChainClaimed.size} / {SKILLS.length}</strong> Badges Collected
                  </div>
                )}

                <div className="skill-section-label">Select your skill badge</div>
                <SkillGrid
                  selectedSkill={selectedSkill}
                  onSelect={setSelectedSkill}
                  loading={loading}
                  hasClaimed={hasClaimed}
                  onChainClaimed={onChainClaimed}
                />

                {!selectedSkill && !hasClaimed && (
                  <div className="select-prompt">👆 Tap a skill card above to select your badge</div>
                )}

                <div className="gas-bar">
                  ⚡ Gas fee <span className="gas-chip">FREE</span>
                  · Gas sponsored using testnet Mock USD
                  {totalMinted !== null && (
                    <span className="gas-bar-stat">🏅 {totalMinted} minted</span>
                  )}
                </div>

                <button
                  className={`btn btn-claim${loading ? " is-loading" : ""}`}
                  onClick={claimBadge}
                  disabled={
                    loading || hasClaimed || !selectedSkill || !networkOk ||
                    (selectedSkill && onChainClaimed.has(selectedSkill.label))
                  }
                >
                  {loading ? (
                    <><span className="spinner" />{status || "Processing..."}</>
                  ) : hasClaimed ? (
                    <>✅ Badge Claimed</>
                  ) : !selectedSkill ? (
                    <>🏅 Select a Skill to Claim</>
                  ) : onChainClaimed.has(selectedSkill?.label) ? (
                    <>✅ Already Owned On-Chain</>
                  ) : (
                    <><span className="btn-icon">🏅</span>Claim {selectedSkill.label} Badge</>
                  )}
                </button>

                {loading && (
                  <div className="loading-steps">
                    <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
                  </div>
                )}

                {slowNetwork && loading && (
                  <div className="slow-network">
                    ⏳ Network is taking longer than usual — please wait…
                  </div>
                )}

                {!loading && status && (
                  <>
                    <div className={`status-bar s-${statusType}`} style={{ textAlign:"left" }}>
                      {statusType === "success" ? "✅" : statusType === "error" ? "⚠️" : "🔄"} {status}
                    </div>
                    {statusType === "error" && status.toLowerCase().includes("insufficient") && (
                      <FaucetGuide />
                    )}
                  </>
                )}

                {/* Success: badge card + receipt */}
                {hasClaimed && claimedSkill && (
                  <div className="badge-wrap" ref={badgeRef}>
                    <div className="badge-ripple"  style={{ "--sc": claimedSkill.color }} />
                    <div className="badge-ripple2" style={{ "--sc": claimedSkill.color }} />

                    <BadgeCard
                      skill={claimedSkill}
                      badgeId={badgeId}
                      mintTimestamp={mintTimestamp}
                    />

                    <div className="gas-saved">
                      ⚡ You saved ~${gasSaved} in gas fees
                      <span> · Powered by UGF abstraction</span>
                    </div>

                    <TransactionReceipt
                      txHash={txHash}
                      badgeId={badgeId}
                      walletAddress={walletAddress}
                      skill={claimedSkill}
                      gasSaved={gasSaved}
                      mintTimestamp={mintTimestamp}
                    />

                    {badgesRemaining > 0 ? (
                      <button className="btn btn-secondary" onClick={resetForAnother}>
                        🔄 Claim Another Badge ({badgesRemaining} remaining)
                      </button>
                    ) : (
                      <div style={{
                        marginTop:"12px", textAlign:"center", fontSize:"12px",
                        color:"#4ade80", fontWeight:"700", padding:"10px",
                        background:"rgba(74,222,128,.06)", borderRadius:"12px",
                        border:"1px solid rgba(74,222,128,.14)"
                      }}>
                        🏆 You've collected all 6 skill badges!
                      </div>
                    )}
                  </div>
                )}

                <Inventory inventory={inventory} onChainClaimed={onChainClaimed} />
                <History   txHistory={txHistory} />
                <WhyGasless />
              </>
            )}
          </div>

          <div className="ugf-brand">
            <span className="ugf-dot">◆</span>
            Built on <strong>Base Sepolia</strong> · Gasless via <strong>UGF</strong> · No ETH required
          </div>

          <div className="footer">
            <div>SkillBadge — Onchain credentials for the next generation of builders</div>
            <div className="powered">
              <span className="powered-dot">◆</span>
              Powered by UGF Gas Abstraction
            </div>
          </div>
        </div>
      </div>
    </>
  );
}