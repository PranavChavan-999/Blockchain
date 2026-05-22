import { useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount, useChainId, useSignMessage, useSwitchChain } from "wagmi";
import { switchProviderToBaseSepolia } from "../lib/walletReady";
import { getAuthorizedEthersSigner } from "../lib/walletSigner";
import { ugfPreauthWithSignMessage } from "../lib/ugfAuth";
import { waitForNewUgfResult } from "../lib/ugfModalWait";
import { useUGFModal } from "@tychilabs/react-ugf";
import { useAuthStore } from "../store/useAuthStore";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_CHAIN_ID_DEC,
  BASE_SEPOLIA_RPC,
  SKILLS,
} from "../config/constants";
import Confetti from "../components/Confetti";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import StatsBar from "../components/StatsBar";
import BenefitCards from "../components/BenefitCards";
import FooterTags from "../components/FooterTags";
import Stepper from "../components/Stepper";
import SkillGrid from "../components/SkillGrid";
import BadgeCard from "../components/BadgeCard";
import TransactionReceipt from "../components/TransactionReceipt";
import Inventory from "../components/Inventory";
import History from "../components/History";
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

function getBaseSepoliaReadProvider() {
  return new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC, BASE_SEPOLIA_CHAIN_ID_DEC);
}

async function checkHasClaimedSkill(walletAddress, skillLabel) {
  const provider = getBaseSepoliaReadProvider();
  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (code === "0x") {
    console.error("[hasClaimedSkill] No contract at address on Base Sepolia:", CONTRACT_ADDRESS);
    return false;
  }
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  try {
    return await contract.hasClaimedSkill(walletAddress, skillLabel);
  } catch (err) {
    if (err?.code === "BAD_DATA") {
      console.warn("[hasClaimedSkill] BAD_DATA — contract returned 0x. Wrong address or ABI?");
    }
    return false;
  }
}

async function getWalletChainId() {
  if (!window.ethereum) return null;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return Number(network.chainId);
  } catch {
    return null;
  }
}

function isSigningRequestNotFoundError(err) {
  const msg = err?.message ?? "";
  if (msg.includes("Signing request not found")) return true;
  const gql = err?.graphQLErrors ?? err?.response?.errors;
  return Array.isArray(gql) && gql.some((e) => String(e?.message ?? "").includes("Signing request"));
}

export default function HomePage() {
  const { address, isConnected, connector, status: walletStatus } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const {
    address: authAddress,
    isAuthenticated,
    isLoading: authLoading,
    authError,
    authStatusMessage,
  } = useAuthStore();

  const walletAddress = address || "";
  const isLoggedIn =
    isConnected &&
    isAuthenticated &&
    !!walletAddress &&
    authAddress === walletAddress.toLowerCase();

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

  const { openUGF, result: ugfModalResult } = useUGFModal();
  const ugfModalResultRef = useRef(ugfModalResult);
  ugfModalResultRef.current = ugfModalResult;
  const getUgfModalResult = useCallback(() => ugfModalResultRef.current, []);

  // ── Generate floating particles once ─────────────────────────
  useEffect(() => {
    setParticles(
      Array.from({ length: 10 }, (_, i) => ({
        id:      i,
        x:       Math.random() * 100,
        y:       Math.random() * 100,
        size:    Math.random() * 2.5 + 1.5,
        dur:     Math.random() * 16 + 24,
        delay:   Math.random() * 8,
        opacity: Math.random() * 0.08 + 0.04,
        tone:    i % 2 === 0 ? "cyan" : "purple",
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

  useEffect(() => {
    async function verifyContract() {
      try {
        const provider = getBaseSepoliaReadProvider();
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === "0x") {
          console.error("CONTRACT NOT DEPLOYED at:", CONTRACT_ADDRESS, "on Base Sepolia");
        } else {
          console.log("Contract verified at:", CONTRACT_ADDRESS);
        }
      } catch (err) {
        console.error("Contract verification failed:", err?.message ?? err);
      }
    }
    verifyContract();
  }, []);

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

  // ── Fetch on-chain state (static RPC — avoids window.ethereum during connect) ──
  async function fetchOnChainState(address) {
    if (!address) return;
    try {
      const provider = getBaseSepoliaReadProvider();
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
      await switchChain({ chainId: BASE_SEPOLIA_CHAIN_ID_DEC });
      setNetworkOk(true);
    } catch (_) {
      if (connector) {
        try {
          await switchProviderToBaseSepolia(connector);
          setNetworkOk(true);
        } catch (switchErr) {
          console.warn("[network] switch failed:", switchErr?.message ?? switchErr);
        }
      }
    }
  }

  async function claimBadge() {
    setStatus(""); setLoading(true); setSlowNetwork(false);
    setHasClaimed(false); setClaimedSkill(null); setTxHash(""); setBadgeId(null); setMintTimestamp("");

    let signerAddr = "";

    try {
      if (!isConnected || !address || walletStatus !== "connected") {
        setMsg("Connect your wallet via ConnectKit before claiming.", "error");
        setLoading(false);
        return;
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID_DEC) {
        setMsg("Wrong network. Please switch to Base Sepolia in MetaMask.", "error");
        setNetworkOk(false);
        setLoading(false);
        return;
      }

      setMsg("Getting gas quote...", "info");
      setNetworkOk(true);

      const signer = await getAuthorizedEthersSigner(connector, address);
      signerAddr = await signer.getAddress();
      const iface  = new ethers.Interface(CONTRACT_ABI);
      const data   = iface.encodeFunctionData("claimBadge", [selectedSkill.label]);

      setMsg("Authorizing UGF gasless service…", "info");
      const ugfToken = await ugfPreauthWithSignMessage(
        address,
        signMessageAsync,
        "testnet"
      );
      if (!ugfToken) {
        setMsg(
          "UGF authorization failed. Connect wallet in MetaMask and approve the sign-in prompt.",
          "error"
        );
        setLoading(false);
        return;
      }

      setMsg("Complete gas payment in the UGF modal…", "info");

      let result;
      try {
        await openUGF({
          signer,
          tx: { to: CONTRACT_ADDRESS, data, value: BigInt(0) },
          destChainId: "84532",
        });
        // Snapshot after openUGF clears prior result (patched react-ugf); hash compare handles legacy state.
        result = await waitForNewUgfResult(
          getUgfModalResult,
          getUgfModalResult()
        );
      } catch (ugfErr) {
        if (isSigningRequestNotFoundError(ugfErr)) {
          console.error("[claimBadge] Signing request not found — request may have expired");
          setMsg("Your signing session expired. Please click \"Claim Badge\" again to restart.", "error");
          setLoading(false);
          return;
        }
        const msg = ugfErr?.message || String(ugfErr);
        if (msg.includes("UGF payment was not completed")) {
          setMsg(msg, "error");
          setLoading(false);
          return;
        }
        console.error("[claimBadge] UGF flow failed:", ugfErr);
        setMsg(
          "Gas payment failed. Check MetaMask is on Base Sepolia, approve UGF prompts, or use \"Use normal transaction\" in the modal.",
          "error"
        );
        setLoading(false);
        return;
      }

      console.log("[claimBadge] UGF result:", result);

      setMsg("Verifying on Base Sepolia...", "info");

      const hash = extractTxHash(result);
      console.log("[claimBadge] extracted txHash:", hash || "(none — gasless relay or no hash returned)");

      const slowTimer = setTimeout(() => setSlowNetwork(true), 6000);

      let confirmedOnChain = false;
      let realBadgeId      = null;
      let onChainTimestamp = null;

      const readProvider = getBaseSepoliaReadProvider();
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

      function parseBadgeClaimedFromReceipt(receipt) {
        if (!receipt?.logs) return;
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === "BadgeClaimed") {
              onChainTimestamp = Number(parsed.args.timestamp);
              realBadgeId = Number(parsed.args.badgeId);
              console.log("[claimBadge] BadgeClaimed event — badgeId:", realBadgeId, "ts:", onChainTimestamp);
              return;
            }
          } catch (_) {}
        }
      }

      if (!hash) {
        console.warn("[claimBadge] No txHash returned — may be gasless relay. Single on-chain check after delay.");
        await new Promise((r) => setTimeout(r, 5000));
        const walletChain = await getWalletChainId();
        if (walletChain !== null && walletChain !== BASE_SEPOLIA_CHAIN_ID_DEC) {
          setMsg("Wrong network detected. Please switch to Base Sepolia and try again.", "error");
          clearTimeout(slowTimer);
          setSlowNetwork(false);
          setLoading(false);
          return;
        }
        const claimed = await checkHasClaimedSkill(signerAddr, selectedSkill.label);
        if (claimed) {
          confirmedOnChain = true;
          try {
            realBadgeId = Number(await readContract.getBadgeId(signerAddr, selectedSkill.label));
          } catch (_) {}
        } else {
          clearTimeout(slowTimer);
          setSlowNetwork(false);
          setMsg("Badge claim could not be confirmed. Check your wallet and try again.", "error");
          setLoading(false);
          return;
        }
      } else {
        console.log("[claimBadge] waiting for tx to be mined, hash:", hash);
        try {
          const receipt = await Promise.race([
            readProvider.waitForTransaction(hash, 1, 30_000),
            new Promise((_, rej) => setTimeout(() => rej(new Error("receipt timeout")), 30_000)),
          ]);
          console.log("[claimBadge] tx receipt status:", receipt?.status, receipt);
          if (receipt?.status === 1) {
            confirmedOnChain = true;
            parseBadgeClaimedFromReceipt(receipt);
          }
        } catch (receiptErr) {
          console.warn("[claimBadge] waitForTransaction failed, falling back to polling:", receiptErr.message);
        }

        const MAX_ATTEMPTS = 14;
        const POLL_MS = 3000;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS && !confirmedOnChain; attempt++) {
          console.log(`[claimBadge] polling hasClaimedSkill attempt ${attempt}/${MAX_ATTEMPTS}`);

          const walletChain = await getWalletChainId();
          if (walletChain !== null && walletChain !== BASE_SEPOLIA_CHAIN_ID_DEC) {
            console.error(
              `[claimBadge] Wrong network: ${walletChain}. Expected Base Sepolia (${BASE_SEPOLIA_CHAIN_ID_DEC}). Aborting poll.`
            );
            clearTimeout(slowTimer);
            setSlowNetwork(false);
            setMsg("Wrong network detected. Please switch to Base Sepolia and try again.", "error");
            setLoading(false);
            return;
          }

          try {
            const claimed = await checkHasClaimedSkill(signerAddr, selectedSkill.label);
            console.log("[claimBadge] hasClaimedSkill:", claimed);

            if (claimed) {
              confirmedOnChain = true;
              if (!realBadgeId) {
                try {
                  realBadgeId = Number(await readContract.getBadgeId(signerAddr, selectedSkill.label));
                  console.log("[claimBadge] fetched badgeId from contract:", realBadgeId);
                } catch (_) {}
              }
              if (!onChainTimestamp) {
                try {
                  const receipt = await readProvider.getTransactionReceipt(hash);
                  parseBadgeClaimedFromReceipt(receipt);
                } catch (_) {}
              }
              break;
            }
          } catch (pollErr) {
            console.warn(`[claimBadge] poll attempt ${attempt} error:`, pollErr.message);
            if (
              pollErr?.code === "NETWORK_ERROR" ||
              String(pollErr?.message ?? "").includes("network changed")
            ) {
              clearTimeout(slowTimer);
              setSlowNetwork(false);
              setMsg("Network changed during claim. Please stay on Base Sepolia.", "error");
              setLoading(false);
              return;
            }
          }

          if (attempt < MAX_ATTEMPTS) {
            await new Promise((res) => setTimeout(res, POLL_MS));
          }
        }
      }

      clearTimeout(slowTimer);
      setSlowNetwork(false);

      console.log(
        "[claimBadge] final state — confirmedOnChain:",
        confirmedOnChain,
        "| hash:",
        hash,
        "| badgeId:",
        realBadgeId
      );

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

      if (isSigningRequestNotFoundError(err)) {
        setMsg("Your signing session expired. Please click \"Claim Badge\" again to restart.", "error");
        setLoading(false);
        return;
      }

      const m = err?.message?.toLowerCase() ?? "";

      if (m.includes("modal") || m.includes("closed") || m.includes("popup") || m.includes("dismissed")) {
        console.log("[claimBadge] modal closed — checking on-chain state");
        try {
          const addr = signerAddr || address;
          const claimed = await checkHasClaimedSkill(addr, selectedSkill.label);
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
      if (m.includes("network") || m.includes("chain") || m.includes("network changed")) {
        setMsg("Network error. Please ensure you're on Base Sepolia and retry.", "error");
        return;
      }
      if (m.includes("insufficient")) {
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

      <div className="page page-wrapper">
        <div className="bg-grid" aria-hidden="true" />
        <div className="bg-orb" style={{ width:500,height:500,top:-220,left:-220, background:"radial-gradient(circle,rgba(14,165,233,.09) 0%,transparent 70%)" }} aria-hidden="true" />
        <div className="bg-orb" style={{ width:400,height:400,bottom:-160,right:-160, background:"radial-gradient(circle,rgba(14,165,233,.06) 0%,transparent 70%)" }} aria-hidden="true" />
        {particles.map((p) => (
          <div
            key={p.id}
            className={`particle particle--${p.tone}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--op": p.opacity,
            }}
            aria-hidden="true"
          />
        ))}

        <Navbar />

        <div className="site-shell">
          <HeroSection />
          <StatsBar />

          <div className="content content-main claim-section" id="claim">
            <Stepper step={step} />

            <div className="card card-main">
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
                      <div className="all-badges-banner">
                        🏆 You've collected all 6 skill badges!
                      </div>
                    )}
                  </div>
                )}

                <Inventory inventory={inventory} onChainClaimed={onChainClaimed} />
                <History   txHistory={txHistory} />
              </>
            )}
            </div>
          </div>

          <BenefitCards />
          <FooterTags />
        </div>
      </div>
    </>
  );
}