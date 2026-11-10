// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {BOTWallOfWeird} from "../src/BOTWallOfWeird.sol";

contract BOTWallOfWeirdTest is Test {
    BOTWallOfWeird public wall;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    event TileClaimed(
        uint8 indexed tileId,
        address indexed owner,
        uint24 color,
        string message,
        uint256 timestamp
    );

    function setUp() public {
        wall = new BOTWallOfWeird();
    }

    function test_ClaimAvailableTile() public {
        vm.warp(1_700_000_000);
        vm.prank(alice);
        wall.claimTile(42, 0xFF33AA, "stay weird on BOT");

        BOTWallOfWeird.Tile memory tile = wall.getTile(42);
        assertEq(tile.owner, alice);
        assertEq(tile.color, uint24(0xFF33AA));
        assertTrue(tile.claimed);
        assertEq(tile.claimedAt, 1_700_000_000);
        assertEq(tile.message, "stay weird on BOT");
    }

    function test_ClaimAvailableTileWithEmptyMessage() public {
        vm.prank(alice);
        wall.claimTile(0, 0x000000, "");

        BOTWallOfWeird.Tile memory tile = wall.getTile(0);
        assertTrue(tile.claimed);
        assertEq(tile.owner, alice);
        assertEq(tile.color, uint24(0x000000));
        assertEq(tile.message, "");
    }

    function test_RejectDuplicateClaimByAnotherUser() public {
        vm.prank(alice);
        wall.claimTile(7, 0x112233, "first");

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(BOTWallOfWeird.TileAlreadyClaimed.selector, uint8(7)));
        wall.claimTile(7, 0x445566, "second");
    }

    function test_RejectDuplicateClaimBySameUser() public {
        vm.prank(alice);
        wall.claimTile(7, 0x112233, "first");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BOTWallOfWeird.TileAlreadyClaimed.selector, uint8(7)));
        wall.claimTile(7, 0xFFFFFF, "overwrite");
    }

    function test_RejectInvalidTileIds() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BOTWallOfWeird.InvalidTileId.selector, uint8(100)));
        wall.claimTile(100, 0x123456, "out of bounds");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BOTWallOfWeird.InvalidTileId.selector, uint8(255)));
        wall.claimTile(255, 0x123456, "way out of bounds");

        vm.expectRevert(abi.encodeWithSelector(BOTWallOfWeird.InvalidTileId.selector, uint8(100)));
        wall.getTile(100);
    }

    function test_AllowExact40CharMessageAndRejectLonger() public {
        string memory exactly40 = "1234567890123456789012345678901234567890";
        assertEq(bytes(exactly40).length, 40);

        vm.prank(alice);
        wall.claimTile(1, 0xABCDEF, exactly40);
        assertEq(wall.getTile(1).message, exactly40);

        string memory length41 = "12345678901234567890123456789012345678901";
        assertEq(bytes(length41).length, 41);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(BOTWallOfWeird.MessageTooLong.selector, uint256(41), uint256(40))
        );
        wall.claimTile(2, 0xABCDEF, length41);
    }

    function test_CorrectRGBStorageBoundaries() public {
        vm.prank(alice);
        wall.claimTile(0, 0x000000, "black");

        vm.prank(bob);
        wall.claimTile(99, 0xFFFFFF, "white");

        vm.prank(alice);
        wall.claimTile(50, 0x00FF88, "neon");

        assertEq(wall.getTile(0).color, uint24(0x000000));
        assertEq(wall.getTile(99).color, uint24(0xFFFFFF));
        assertEq(wall.getTile(50).color, uint24(0x00FF88));
    }

    function test_CorrectContributorCountingAndStatistics() public {
        (uint256 claimed, uint256 remaining, uint256 contributors) = wall.getStats();
        assertEq(claimed, 0);
        assertEq(remaining, 100);
        assertEq(contributors, 0);

        // Alice claims two different tiles
        vm.prank(alice);
        wall.claimTile(10, 0x111111, "one");

        vm.prank(alice);
        wall.claimTile(11, 0x222222, "two");

        (claimed, remaining, contributors) = wall.getStats();
        assertEq(claimed, 2);
        assertEq(remaining, 98);
        assertEq(contributors, 1);

        // Bob claims one tile
        vm.prank(bob);
        wall.claimTile(12, 0x333333, "three");

        (claimed, remaining, contributors) = wall.getStats();
        assertEq(claimed, 3);
        assertEq(remaining, 97);
        assertEq(contributors, 2);
    }

    function test_CorrectEventEmission() public {
        uint256 ts = 1_750_000_123;
        vm.warp(ts);

        vm.expectEmit(true, true, false, true, address(wall));
        emit TileClaimed(55, alice, 0x7C3AED, "weirdness", ts);

        vm.prank(alice);
        wall.claimTile(55, 0x7C3AED, "weirdness");
    }

    function test_GetWallAndRecentClaimsOrder() public {
        vm.warp(1000);
        vm.prank(alice);
        wall.claimTile(5, 0xAA0000, "first");

        vm.warp(2000);
        vm.prank(bob);
        wall.claimTile(88, 0x00AA00, "second");

        BOTWallOfWeird.Tile[100] memory fullWall = wall.getWall();
        assertTrue(fullWall[5].claimed);
        assertEq(fullWall[5].owner, alice);
        assertTrue(fullWall[88].claimed);
        assertEq(fullWall[88].owner, bob);
        assertFalse(fullWall[0].claimed);

        BOTWallOfWeird.RecentClaim[] memory recent = wall.getRecentClaims();
        assertEq(recent.length, 2);
        assertEq(recent[0].tileId, 88);
        assertEq(recent[0].owner, bob);
        assertEq(recent[1].tileId, 5);
        assertEq(recent[1].owner, alice);
    }
}

