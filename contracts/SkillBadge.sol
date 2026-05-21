// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SkillBadge — on-chain skill credentials for UGF Badge app.
 * ABI must stay in sync with frontend/src/config/constants.js
 */
contract SkillBadge {
    uint256 public totalBadgesMinted;

    mapping(address => mapping(string => bool)) private _claimed;
    mapping(address => mapping(string => uint256)) private _badgeIds;
    mapping(address => string[]) private _claimedSkills;

    event BadgeClaimed(
        address indexed claimer,
        string skill,
        uint256 badgeId,
        uint256 timestamp
    );

    function claimBadge(string memory skillName) public {
        require(bytes(skillName).length > 0, "empty skill");
        require(!_claimed[msg.sender][skillName], "already claimed");

        totalBadgesMinted++;
        uint256 badgeId = totalBadgesMinted;

        _claimed[msg.sender][skillName] = true;
        _badgeIds[msg.sender][skillName] = badgeId;
        _claimedSkills[msg.sender].push(skillName);

        emit BadgeClaimed(msg.sender, skillName, badgeId, block.timestamp);
    }

    function hasClaimedSkill(
        address wallet,
        string memory skillName
    ) public view returns (bool) {
        return _claimed[wallet][skillName];
    }

    function getClaimedSkills(
        address wallet
    ) public view returns (string[] memory) {
        return _claimedSkills[wallet];
    }

    function getBadgeCount(address wallet) public view returns (uint256) {
        return _claimedSkills[wallet].length;
    }

    function getBadgeId(
        address wallet,
        string memory skillName
    ) public view returns (uint256) {
        require(_claimed[wallet][skillName], "not claimed");
        return _badgeIds[wallet][skillName];
    }
}
