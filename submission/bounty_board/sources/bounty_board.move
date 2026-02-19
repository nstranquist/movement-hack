module bounty_board::bounty_board {
    use std::signer;
    use std::vector;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    // ==================== ERRORS ====================

    const E_BOUNTY_NOT_FOUND: u64 = 1;
    const E_BOUNTY_NOT_OPEN: u64 = 2;
    const E_BOUNTY_NOT_CLAIMED: u64 = 3;
    const E_BOUNTY_NOT_SUBMITTED: u64 = 4;
    const E_NOT_CREATOR: u64 = 5;
    const E_NOT_HUNTER: u64 = 6;
    const E_CANNOT_CLAIM_OWN: u64 = 7;
    const E_INSUFFICIENT_AMOUNT: u64 = 8;
    const E_AGENT_EXCEEDS_MAX: u64 = 9;
    const E_NOT_ADMIN: u64 = 10;

    // ==================== STATUS ====================

    const STATUS_OPEN: u8 = 0;
    const STATUS_CLAIMED: u8 = 1;
    const STATUS_SUBMITTED: u8 = 2;
    const STATUS_COMPLETED: u8 = 3;
    const STATUS_CANCELLED: u8 = 4;

    // ==================== STRUCTS ====================

    struct BountyBoard has key {
        bounties: vector<Bounty>,
        next_id: u64,
        total_escrowed: u64,
        signer_cap: SignerCapability,
        resource_addr: address,
        admin: address,
        agent_address: address,
        max_claim_amount: u64,
    }

    struct Bounty has store, drop, copy {
        id: u64,
        creator: address,
        title: vector<u8>,
        description: vector<u8>,
        bounty_amount: u64,
        status: u8,
        hunter: address,
        submission_note: vector<u8>,
        created_at: u64,
    }

    // ==================== EVENTS ====================

    #[event]
    struct BountyCreated has drop, store {
        id: u64,
        creator: address,
        bounty_amount: u64,
    }

    #[event]
    struct BountyClaimed has drop, store {
        id: u64,
        hunter: address,
    }

    #[event]
    struct BountySubmitted has drop, store {
        id: u64,
        hunter: address,
    }

    #[event]
    struct BountyCompleted has drop, store {
        id: u64,
        hunter: address,
        bounty_amount: u64,
    }

    #[event]
    struct BountyCancelled has drop, store {
        id: u64,
        creator: address,
        refund_amount: u64,
    }

    // ==================== INIT ====================

    fun init_module(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);

        // Create resource account to hold escrowed MOVE
        let (resource_signer, signer_cap) = account::create_resource_account(deployer, b"bounty_board");
        let resource_addr = signer::address_of(&resource_signer);
        coin::register<AptosCoin>(&resource_signer);

        move_to(deployer, BountyBoard {
            bounties: vector::empty(),
            next_id: 0,
            total_escrowed: 0,
            signer_cap,
            resource_addr,
            admin: deployer_addr,
            agent_address: @0x0,
            max_claim_amount: 0,
        });
    }

    // ==================== ADMIN ====================

    /// Set the AI agent address and its max claim cap (in octas).
    /// Call once after deploy with the agent's CLI wallet address.
    public entry fun configure_agent(
        admin: &signer,
        agent_addr: address,
        max_amount: u64,
    ) acquires BountyBoard {
        let admin_addr = signer::address_of(admin);
        let board = borrow_global_mut<BountyBoard>(@bounty_board);
        assert!(admin_addr == board.admin, E_NOT_ADMIN);

        board.agent_address = agent_addr;
        board.max_claim_amount = max_amount;
    }

    // ==================== CORE LOOP ====================

    /// Create a bounty, locking MOVE in the escrow resource account.
    public entry fun create_bounty(
        creator: &signer,
        title: vector<u8>,
        description: vector<u8>,
        bounty_amount: u64,
    ) acquires BountyBoard {
        let creator_addr = signer::address_of(creator);
        assert!(bounty_amount > 0, E_INSUFFICIENT_AMOUNT);

        let board = borrow_global_mut<BountyBoard>(@bounty_board);

        // Lock MOVE in escrow
        coin::transfer<AptosCoin>(creator, board.resource_addr, bounty_amount);

        let bounty_id = board.next_id;
        vector::push_back(&mut board.bounties, Bounty {
            id: bounty_id,
            creator: creator_addr,
            title,
            description,
            bounty_amount,
            status: STATUS_OPEN,
            hunter: @0x0,
            submission_note: vector::empty(),
            created_at: timestamp::now_seconds(),
        });

        board.next_id = bounty_id + 1;
        board.total_escrowed = board.total_escrowed + bounty_amount;

        event::emit(BountyCreated {
            id: bounty_id,
            creator: creator_addr,
            bounty_amount,
        });
    }

    /// Claim an open bounty.
    /// GUARDRAIL: if caller is the registered agent, revert when bounty exceeds max_claim_amount.
    public entry fun claim_bounty(
        hunter: &signer,
        bounty_id: u64,
    ) acquires BountyBoard {
        let hunter_addr = signer::address_of(hunter);
        let board = borrow_global_mut<BountyBoard>(@bounty_board);

        assert!(bounty_id < vector::length(&board.bounties), E_BOUNTY_NOT_FOUND);
        let bounty = vector::borrow_mut(&mut board.bounties, bounty_id);

        assert!(bounty.status == STATUS_OPEN, E_BOUNTY_NOT_OPEN);
        assert!(bounty.creator != hunter_addr, E_CANNOT_CLAIM_OWN);

        // On-chain guardrail: agent cannot claim bounties above its cap
        if (hunter_addr == board.agent_address) {
            assert!(bounty.bounty_amount <= board.max_claim_amount, E_AGENT_EXCEEDS_MAX);
        };

        bounty.status = STATUS_CLAIMED;
        bounty.hunter = hunter_addr;

        event::emit(BountyClaimed {
            id: bounty_id,
            hunter: hunter_addr,
        });
    }

    /// Hunter submits proof of work.
    public entry fun submit_bounty(
        hunter: &signer,
        bounty_id: u64,
        submission_note: vector<u8>,
    ) acquires BountyBoard {
        let hunter_addr = signer::address_of(hunter);
        let board = borrow_global_mut<BountyBoard>(@bounty_board);

        assert!(bounty_id < vector::length(&board.bounties), E_BOUNTY_NOT_FOUND);
        let bounty = vector::borrow_mut(&mut board.bounties, bounty_id);

        assert!(bounty.status == STATUS_CLAIMED, E_BOUNTY_NOT_CLAIMED);
        assert!(bounty.hunter == hunter_addr, E_NOT_HUNTER);

        bounty.status = STATUS_SUBMITTED;
        bounty.submission_note = submission_note;

        event::emit(BountySubmitted {
            id: bounty_id,
            hunter: hunter_addr,
        });
    }

    /// Creator approves submission — escrow releases MOVE to the hunter.
    public entry fun approve_bounty(
        creator: &signer,
        bounty_id: u64,
    ) acquires BountyBoard {
        let creator_addr = signer::address_of(creator);
        let board = borrow_global_mut<BountyBoard>(@bounty_board);

        assert!(bounty_id < vector::length(&board.bounties), E_BOUNTY_NOT_FOUND);
        let bounty = vector::borrow_mut(&mut board.bounties, bounty_id);

        assert!(bounty.status == STATUS_SUBMITTED, E_BOUNTY_NOT_SUBMITTED);
        assert!(bounty.creator == creator_addr, E_NOT_CREATOR);

        bounty.status = STATUS_COMPLETED;

        // Release escrow to hunter
        let resource_signer = account::create_signer_with_capability(&board.signer_cap);
        coin::transfer<AptosCoin>(&resource_signer, bounty.hunter, bounty.bounty_amount);
        board.total_escrowed = board.total_escrowed - bounty.bounty_amount;

        event::emit(BountyCompleted {
            id: bounty_id,
            hunter: bounty.hunter,
            bounty_amount: bounty.bounty_amount,
        });
    }

    /// Cancel an open (unclaimed) bounty — refund creator from escrow.
    public entry fun cancel_bounty(
        creator: &signer,
        bounty_id: u64,
    ) acquires BountyBoard {
        let creator_addr = signer::address_of(creator);
        let board = borrow_global_mut<BountyBoard>(@bounty_board);

        assert!(bounty_id < vector::length(&board.bounties), E_BOUNTY_NOT_FOUND);
        let bounty = vector::borrow_mut(&mut board.bounties, bounty_id);

        assert!(bounty.status == STATUS_OPEN, E_BOUNTY_NOT_OPEN);
        assert!(bounty.creator == creator_addr, E_NOT_CREATOR);

        bounty.status = STATUS_CANCELLED;

        // Refund creator
        let resource_signer = account::create_signer_with_capability(&board.signer_cap);
        coin::transfer<AptosCoin>(&resource_signer, creator_addr, bounty.bounty_amount);
        board.total_escrowed = board.total_escrowed - bounty.bounty_amount;

        event::emit(BountyCancelled {
            id: bounty_id,
            creator: creator_addr,
            refund_amount: bounty.bounty_amount,
        });
    }

    // ==================== VIEW FUNCTIONS ====================

    #[view]
    public fun get_all_bounties(): vector<Bounty> acquires BountyBoard {
        borrow_global<BountyBoard>(@bounty_board).bounties
    }

    #[view]
    public fun get_bounty(bounty_id: u64): Bounty acquires BountyBoard {
        let board = borrow_global<BountyBoard>(@bounty_board);
        assert!(bounty_id < vector::length(&board.bounties), E_BOUNTY_NOT_FOUND);
        *vector::borrow(&board.bounties, bounty_id)
    }

    #[view]
    public fun get_bounty_count(): u64 acquires BountyBoard {
        vector::length(&borrow_global<BountyBoard>(@bounty_board).bounties)
    }

    #[view]
    public fun get_agent_address(): address acquires BountyBoard {
        borrow_global<BountyBoard>(@bounty_board).agent_address
    }

    #[view]
    public fun get_max_claim_amount(): u64 acquires BountyBoard {
        borrow_global<BountyBoard>(@bounty_board).max_claim_amount
    }

    #[view]
    public fun get_resource_address(): address acquires BountyBoard {
        borrow_global<BountyBoard>(@bounty_board).resource_addr
    }

    #[view]
    public fun get_total_escrowed(): u64 acquires BountyBoard {
        borrow_global<BountyBoard>(@bounty_board).total_escrowed
    }
}
