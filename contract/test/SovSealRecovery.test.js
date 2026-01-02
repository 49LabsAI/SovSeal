const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SovSealRecovery", function () {
    let recovery;
    let owner;
    let guardian1;
    let guardian2;
    let guardian3;
    let newOwner;
    let otherAccount;

    // Recovery delay: 7 days in seconds
    const RECOVERY_DELAY = 7 * 24 * 60 * 60;

    beforeEach(async function () {
        [owner, guardian1, guardian2, guardian3, newOwner, otherAccount] =
            await ethers.getSigners();

        const SovSealRecovery = await ethers.getContractFactory("SovSealRecovery");
        recovery = await SovSealRecovery.deploy();
        await recovery.waitForDeployment();
    });

    describe("Guardian Management", function () {
        it("Should add a guardian successfully", async function () {
            await expect(recovery.addGuardian(guardian1.address, 1))
                .to.emit(recovery, "GuardianAdded")
                .withArgs(owner.address, guardian1.address, 1);

            const guardians = await recovery.getGuardians(owner.address);
            expect(guardians.length).to.equal(1);
            expect(guardians[0].addr).to.equal(guardian1.address);
            expect(guardians[0].weight).to.equal(1);
            expect(guardians[0].isActive).to.equal(true);
        });

        it("Should add multiple guardians", async function () {
            await recovery.addGuardian(guardian1.address, 1);
            await recovery.addGuardian(guardian2.address, 2);
            await recovery.addGuardian(guardian3.address, 1);

            const guardians = await recovery.getGuardians(owner.address);
            expect(guardians.length).to.equal(3);
        });

        it("Should revert if adding self as guardian", async function () {
            await expect(
                recovery.addGuardian(owner.address, 1)
            ).to.be.revertedWithCustomError(recovery, "InvalidAddress");
        });

        it("Should revert if adding duplicate guardian", async function () {
            await recovery.addGuardian(guardian1.address, 1);

            await expect(
                recovery.addGuardian(guardian1.address, 1)
            ).to.be.revertedWithCustomError(recovery, "GuardianAlreadyExists");
        });

        it("Should revert if weight is zero", async function () {
            await expect(
                recovery.addGuardian(guardian1.address, 0)
            ).to.be.revertedWithCustomError(recovery, "InvalidThreshold");
        });

        it("Should remove a guardian successfully", async function () {
            await recovery.addGuardian(guardian1.address, 1);

            await expect(recovery.removeGuardian(guardian1.address))
                .to.emit(recovery, "GuardianRemoved")
                .withArgs(owner.address, guardian1.address);

            const guardians = await recovery.getGuardians(owner.address);
            expect(guardians.length).to.equal(0);
        });

        it("Should revert if removing non-existent guardian", async function () {
            await expect(
                recovery.removeGuardian(guardian1.address)
            ).to.be.revertedWithCustomError(recovery, "GuardianNotFound");
        });
    });

    describe("Threshold Management", function () {
        it("Should set threshold successfully", async function () {
            await recovery.addGuardian(guardian1.address, 2);
            await recovery.addGuardian(guardian2.address, 2);

            await expect(recovery.setThreshold(2))
                .to.emit(recovery, "ThresholdUpdated")
                .withArgs(owner.address, 2);

            expect(await recovery.thresholds(owner.address)).to.equal(2);
        });

        it("Should revert if threshold less than minimum", async function () {
            await recovery.addGuardian(guardian1.address, 2);

            await expect(recovery.setThreshold(1)).to.be.revertedWithCustomError(
                recovery,
                "InvalidThreshold"
            );
        });

        it("Should revert if threshold exceeds total weight", async function () {
            await recovery.addGuardian(guardian1.address, 1);
            await recovery.addGuardian(guardian2.address, 1);

            await expect(recovery.setThreshold(5)).to.be.revertedWithCustomError(
                recovery,
                "InvalidThreshold"
            );
        });
    });

    describe("Recovery Initiation", function () {
        beforeEach(async function () {
            // Setup: 3 guardians with weight 1 each, threshold 2
            await recovery.addGuardian(guardian1.address, 1);
            await recovery.addGuardian(guardian2.address, 1);
            await recovery.addGuardian(guardian3.address, 1);
            await recovery.setThreshold(2);
        });

        it("Should initiate recovery successfully", async function () {
            const tx = await recovery
                .connect(guardian1)
                .initiateRecovery(owner.address, newOwner.address);

            await expect(tx)
                .to.emit(recovery, "RecoveryInitiated")
                .withArgs(
                    1,
                    owner.address,
                    newOwner.address,
                    (await time.latest()) + RECOVERY_DELAY
                );

            expect(await recovery.activeRecovery(owner.address)).to.equal(1);
        });

        it("Should revert if initiated by non-guardian", async function () {
            await expect(
                recovery
                    .connect(otherAccount)
                    .initiateRecovery(owner.address, newOwner.address)
            ).to.be.revertedWithCustomError(recovery, "NotGuardian");
        });

        it("Should revert if owner equals new owner", async function () {
            await expect(
                recovery
                    .connect(guardian1)
                    .initiateRecovery(owner.address, owner.address)
            ).to.be.revertedWithCustomError(recovery, "InvalidAddress");
        });

        it("Should revert if recovery already active", async function () {
            await recovery
                .connect(guardian1)
                .initiateRecovery(owner.address, newOwner.address);

            await expect(
                recovery
                    .connect(guardian2)
                    .initiateRecovery(owner.address, otherAccount.address)
            ).to.be.revertedWithCustomError(recovery, "RecoveryAlreadyActive");
        });
    });

    describe("Recovery Approval", function () {
        beforeEach(async function () {
            await recovery.addGuardian(guardian1.address, 1);
            await recovery.addGuardian(guardian2.address, 1);
            await recovery.addGuardian(guardian3.address, 1);
            await recovery.setThreshold(2);
            await recovery
                .connect(guardian1)
                .initiateRecovery(owner.address, newOwner.address);
        });

        it("Should approve recovery successfully", async function () {
            await expect(recovery.connect(guardian1).approveRecovery(1))
                .to.emit(recovery, "RecoveryApproved")
                .withArgs(1, guardian1.address, 1, 2);
        });

        it("Should accumulate approval weight", async function () {
            await recovery.connect(guardian1).approveRecovery(1);
            await recovery.connect(guardian2).approveRecovery(1);

            const request = await recovery.getRecoveryRequest(1);
            expect(request.approvalWeight).to.equal(2);
        });

        it("Should revert if guardian already approved", async function () {
            await recovery.connect(guardian1).approveRecovery(1);

            await expect(
                recovery.connect(guardian1).approveRecovery(1)
            ).to.be.revertedWithCustomError(recovery, "RecoveryAlreadyApproved");
        });

        it("Should revert if non-guardian tries to approve", async function () {
            await expect(
                recovery.connect(otherAccount).approveRecovery(1)
            ).to.be.revertedWithCustomError(recovery, "NotGuardian");
        });
    });

    describe("Recovery Execution", function () {
        beforeEach(async function () {
            await recovery.addGuardian(guardian1.address, 1);
            await recovery.addGuardian(guardian2.address, 1);
            await recovery.addGuardian(guardian3.address, 1);
            await recovery.setThreshold(2);
            await recovery
                .connect(guardian1)
                .initiateRecovery(owner.address, newOwner.address);
            await recovery.connect(guardian1).approveRecovery(1);
            await recovery.connect(guardian2).approveRecovery(1);
        });

        it("Should execute recovery after time-lock", async function () {
            // Fast forward 7 days
            await time.increase(RECOVERY_DELAY + 1);

            await expect(recovery.executeRecovery(1))
                .to.emit(recovery, "RecoveryExecuted")
                .withArgs(1, owner.address, newOwner.address);

            // Verify recovery is cleared
            expect(await recovery.activeRecovery(owner.address)).to.equal(0);

            // Verify guardians transferred to new owner
            const newOwnerGuardians = await recovery.getGuardians(newOwner.address);
            expect(newOwnerGuardians.length).to.equal(3);
        });

        it("Should revert if time-lock not expired", async function () {
            await expect(recovery.executeRecovery(1)).to.be.revertedWithCustomError(
                recovery,
                "TimeLockNotExpired"
            );
        });

        it("Should revert if threshold not met", async function () {
            // Setup new recovery with only 1 approval
            await recovery
                .connect(guardian1)
                .cancelRecovery(1);
            await recovery
                .connect(guardian1)
                .initiateRecovery(owner.address, newOwner.address);
            await recovery.connect(guardian1).approveRecovery(2);

            await time.increase(RECOVERY_DELAY + 1);

            await expect(recovery.executeRecovery(2)).to.be.revertedWithCustomError(
                recovery,
                "ThresholdNotMet"
            );
        });
    });

    describe("Recovery Cancellation", function () {
        beforeEach(async function () {
            await recovery.addGuardian(guardian1.address, 1);
            await recovery.addGuardian(guardian2.address, 1);
            await recovery.setThreshold(2);
            await recovery
                .connect(guardian1)
                .initiateRecovery(owner.address, newOwner.address);
        });

        it("Should allow owner to cancel recovery", async function () {
            await expect(recovery.cancelRecovery(1))
                .to.emit(recovery, "RecoveryCancelled")
                .withArgs(1, owner.address);

            expect(await recovery.activeRecovery(owner.address)).to.equal(0);
        });

        it("Should allow guardian to cancel recovery", async function () {
            await expect(recovery.connect(guardian1).cancelRecovery(1))
                .to.emit(recovery, "RecoveryCancelled")
                .withArgs(1, guardian1.address);
        });

        it("Should revert if non-authorized tries to cancel", async function () {
            await expect(
                recovery.connect(otherAccount).cancelRecovery(1)
            ).to.be.revertedWithCustomError(recovery, "NotGuardian");
        });

        it("Should revert if already cancelled", async function () {
            await recovery.cancelRecovery(1);

            await expect(recovery.cancelRecovery(1)).to.be.revertedWithCustomError(
                recovery,
                "RecoveryAlreadyCancelled"
            );
        });
    });

    describe("Edge Cases", function () {
        it("Should handle weighted guardian voting", async function () {
            // Guardian 1 has weight 3, guardian 2 has weight 1
            await recovery.addGuardian(guardian1.address, 3);
            await recovery.addGuardian(guardian2.address, 1);
            await recovery.setThreshold(3);

            await recovery
                .connect(guardian1)
                .initiateRecovery(owner.address, newOwner.address);

            // Single approval from guardian1 (weight 3) should meet threshold
            await recovery.connect(guardian1).approveRecovery(1);

            const request = await recovery.getRecoveryRequest(1);
            expect(request.approvalWeight).to.equal(3);

            // Should be able to execute
            await time.increase(RECOVERY_DELAY + 1);
            await expect(recovery.executeRecovery(1)).to.not.be.reverted;
        });
    });
});
