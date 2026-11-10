// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title BOTWallOfWeird
/// @notice Collaborative 10x10 on-chain pixel wall on BOT Chain Testnet.
///         All interactions require network gas only — zero protocol or mint fees.
contract BOTWallOfWeird {
    uint8 public constant WALL_SIZE = 100;
    uint256 public constant MAX_MESSAGE_LENGTH = 40;
    uint256 public constant MAX_MESSAGE_BYTES = 160;
    uint24 public constant MAX_COLOR = 0xFFFFFF;

    struct Tile {
        address owner;
        uint24 color;
        bool claimed;
        uint64 claimedAt;
        string message;
    }

    struct RecentClaim {
        uint8 tileId;
        address owner;
        uint24 color;
        uint64 claimedAt;
        string message;
    }

    Tile[WALL_SIZE] private _tiles;
    uint8[] private _claimOrder;

    uint256 public totalClaimed;
    uint256 public uniqueContributors;
    mapping(address => bool) public hasContributed;

    event TileClaimed(
        uint8 indexed tileId,
        address indexed owner,
        uint24 color,
        string message,
        uint256 timestamp
    );

    error InvalidTileId(uint8 tileId);
    error TileAlreadyClaimed(uint8 tileId);
    error MessageTooLong(uint256 length, uint256 maxLength);
    error MessageBytesExceeded(uint256 byteLength, uint256 maxBytes);
    error InvalidColor(uint24 color);

    /// @notice Permanently claims an unoccupied tile on the 10x10 wall.
    /// @dev Non-payable: users pay ordinary network gas only.
    /// @param tileId Tile index between 0 and 99.
    /// @param color 24-bit RGB color (0x000000 - 0xFFFFFF).
    /// @param message Optional short message (max 40 characters).
    function claimTile(
        uint8 tileId,
        uint24 color,
        string calldata message
    ) external {
        if (tileId >= WALL_SIZE) {
            revert InvalidTileId(tileId);
        }
        if (_tiles[tileId].claimed) {
            revert TileAlreadyClaimed(tileId);
        }
        if (color > MAX_COLOR) {
            revert InvalidColor(color);
        }

        uint256 byteLen = bytes(message).length;
        if (byteLen > MAX_MESSAGE_BYTES) {
            revert MessageBytesExceeded(byteLen, MAX_MESSAGE_BYTES);
        }

        uint256 charLen = _utf8Length(message);
        if (charLen > MAX_MESSAGE_LENGTH) {
            revert MessageTooLong(charLen, MAX_MESSAGE_LENGTH);
        }

        uint64 claimTimestamp = uint64(block.timestamp);

        _tiles[tileId] = Tile({
            owner: msg.sender,
            color: color,
            claimed: true,
            claimedAt: claimTimestamp,
            message: message
        });

        unchecked {
            totalClaimed += 1;
        }

        if (!hasContributed[msg.sender]) {
            hasContributed[msg.sender] = true;
            unchecked {
                uniqueContributors += 1;
            }
        }

        _claimOrder.push(tileId);

        emit TileClaimed(tileId, msg.sender, color, message, block.timestamp);
    }

    /// @notice Returns full details for a single tile (0..99).
    function getTile(uint8 tileId) external view returns (Tile memory) {
        if (tileId >= WALL_SIZE) {
            revert InvalidTileId(tileId);
        }
        return _tiles[tileId];
    }

    /// @notice Returns all 100 tiles in index order (0..99).
    function getWall() external view returns (Tile[WALL_SIZE] memory wall) {
        for (uint256 i = 0; i < WALL_SIZE; ) {
            wall[i] = _tiles[i];
            unchecked {
                ++i;
            }
        }
    }

    /// @notice Returns live wall statistics: claimed tiles, remaining tiles, and unique contributors.
    function getStats()
        external
        view
        returns (
            uint256 claimedCount,
            uint256 remainingCount,
            uint256 contributorCount
        )
    {
        claimedCount = totalClaimed;
        remainingCount = WALL_SIZE - totalClaimed;
        contributorCount = uniqueContributors;
    }

    /// @notice Returns claimed tiles ordered from newest to oldest.
    function getRecentClaims() external view returns (RecentClaim[] memory recent) {
        uint256 len = _claimOrder.length;
        recent = new RecentClaim[](len);

        for (uint256 i = 0; i < len; ) {
            uint8 tileId = _claimOrder[len - 1 - i];
            Tile storage tile = _tiles[tileId];
            recent[i] = RecentClaim({
                tileId: tileId,
                owner: tile.owner,
                color: tile.color,
                claimedAt: tile.claimedAt,
                message: tile.message
            });
            unchecked {
                ++i;
            }
        }
    }

    function _utf8Length(string calldata str) internal pure returns (uint256 count) {
        bytes calldata b = bytes(str);
        uint256 len = b.length;
        for (uint256 i = 0; i < len; ) {
            uint8 c = uint8(b[i]);
            if ((c & 0xC0) != 0x80) {
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }
    }
}

