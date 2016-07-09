/*
 * Population Handler
 *
 * Main Responsibilities:
 *  - Run the creeps according to their roles/state
 *  - Spawn new creeps
 *      - keep track of creep type distribution
 *  - Report on population numbers
 *
 *  TODO: Add a job-Manager function (re-assign haulers to miners, miners to sources, etc...)
 *  TODO: Clean this up, it's messy.
 */


/**
 * Population - The Population Handler
 *
 * @param room a Game.Room object referring to the room this handler will work in.
 * @constructor
 */
function Population (room)
{
    this.room = room;
    var roomInfo = room.memory.roomInfo;

    this.spawns = roomInfo.spawns;
    this.sources = roomInfo.sources;

    this.creeps = this.room.find(FIND_MY_CREEPS);
    this.creepTypeDistribution = getCreepTypeDistribution(this.creeps);

    // Save/update the Creep Type Distribution object in the roomInfo persistent memory
    roomInfo.creepTypeDistribution = this.creepTypeDistribution;
}

/**
 * Execute all actions this Object is responsible for:
 *  - Run the creeps according to their role/state
 *  - Spawn new creeps
 */
Population.prototype.run = function ()
{
    // Run the creeps
    var roles = require('core.Roles');

    for(let name in this.creeps) 
    { 

        roles[this.creeps[name].memory.role].run(this.creeps[name]);
    }

    // Try to spawn the next creep in the line.
    // TODO: replace this with the cleaner code once it's ready
    this.SpawnNewCreep();
/*
    var nextSpawn = this._getNextSpawn();
    if (nextSpawn)
    {
        this._SpawnNewCreep(nextSpawn); //old code
    }
*/
};


Population.prototype.SpawnNewCreep = function ()
{
   // console.log("Attempt to spawn new creep");
  /*
   * Work in Progress
   *
   *    1. Figure out which spawn can build the new creep
   *    2. Figure Out which creep role we need next
   *    3. Figure Out the properties of the new creep
   *        - based on the role, cost, available energy, etc...
   *    4. Give the spawn order (with all the necessary properties)
   *
   */

    var unitNames = require('lib.UnitNames');
    var spawner = {};
    var newCreepDetails = {};

    spawner = getFreeSpawner(this.room);
    if (spawner)
    {
        //console.log("There is a spawner");
        
    let newCreepRole = {};   
    var n = this._getNextSpawn();
    if (n !== undefined)
    {
         newCreepRole = n.creepRole;
    }
    else
    {
        newCreepRole = nextCreepRole(this.room);
    }
        
        //console.log("next role: " + nextCreepRole(this.room));
        if (newCreepRole)
        {
            //console.log("newCreepRole");
            newCreepDetails = getNewCreepDetailsByRole(newCreepRole);

            newCreepDetails.body = getBestBody(newCreepDetails, spawner.room.energyCapacityAvailable);
            newCreepDetails.name = '[' + newCreepDetails.type + '-' + newCreepDetails.tier + '] ' + unitNames.Generate();
            newCreepDetails.initialmemory.role = newCreepRole;
            
            //console.log(newCreepDetails.name);
            // We should have everything we need. Try to spawn it.
            if(spawner.canCreateCreep(newCreepDetails.body,newCreepDetails.name) == OK)
            {
                //console.log("Attempting to create new creep");
                let result = spawner.createCreep(newCreepDetails.body, newCreepDetails.name, newCreepDetails.initialmemory );
                //console.log(result);
                if (result == newCreepDetails.name)
                {
                    console.log('control.Population:  Spawner [' + spawner.name + ']'
                                + ' - Spawning new Creep: ' + newCreepDetails.name
                                + ' - Role: ' + newCreepDetails.role
                                );
                }
                else {
                    console.log("Probably making a creep already.");
                }
                //TODO Add tests if not OK, figure out what went wrong.

            }  else {
            //console.log("Not Enough Energy");
        }
         }
    }
};



Population.prototype._SpawnNewCreep = function (spawnType)
{
    var unitNames = require('lib.UnitNames');
    var creepClasses = require('lib.CreepTypes');

    // Geth the spawn info from the creep class definitions


    if (creepClasses[spawnType.creepType])
    {
        var bodyparts = creepClasses[spawnType.creepType].body;
        var name = '[' + spawnType.creepType + '] ' + unitNames.Generate() ;
        var initialmemory = creepClasses[spawnType.creepType].initialmemory;
        initialmemory.role = spawnType.creepRole;

        for (var n in this.spawns )
        {

            var spawner = Game.getObjectById(this.spawns[n].id);
            if(spawner.canCreateCreep(bodyparts, name) == OK)
            {
                spawner.createCreep(bodyparts, name, initialmemory );
                console.log('control.Population:  Spawner [' + spawner.name + '] - Spawning new Creep: ' + name + ' - Role: ' + spawnType.creepRole );
            }
        }

    }
    else
    {
        console.log('role.spawner: SpawnNewCreep: [WARNING] - Unknown Creep Class: ' + spawnType.creepType)
    }
};

Population.prototype._getNextSpawn =  function ()
{
    //What should we spawn next.
    var nextSpawns = [] ;
    var spawnPriority = 0;

    // ----------------------------
    spawnPriority = 1;  // (lower is better)
    // ----------------------------

    // if we have no creeps. Spawn in a harvester
    if (this.creepTypeDistribution.total == 0)
    {
        // console.log('contol.Population: Priority ' + spawnPriority + ': Room [' + this.room.name + '] has no creeps. Spawn a harvester to get us started.');
        nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'SCV', creepRole: 'harvester'} );
    }

    // if we have no miners, spawn one
    if ( !this.creepTypeDistribution.roles.miner )
    {
        // console.log('contol.Population: Priority ' + spawnPriority + ': Room [' + this.room.name + '] has no miner creeps. This will not stand!');
        nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'SEV', creepRole: 'miner'} );
    }
    


    // ----------------------------
    spawnPriority = 2;  // (lower is better)
    // ----------------------------
    


    // ----------------------------
    spawnPriority = 3; // (lower is better)
    // ----------------------------
    
    // Try to have equal haulers & miners
    if ( !this.creepTypeDistribution.roles.hauler || ( this.creepTypeDistribution.roles.hauler < this.creepTypeDistribution.roles.miner ) )
    {
        // console.log('contol.Population: Priority ' + spawnPriority + ': Room [' + this.room.name + '] has less haulers than miners.');
        nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'STV', creepRole: 'hauler'} );
    }
    // Try to have equal builders & miners (or even 1 more)
    if ( !this.creepTypeDistribution.roles.builder || (this.creepTypeDistribution.roles.builder <= this.creepTypeDistribution.roles.miner ) )
    {
        // console.log('contol.Population: Priority ' + spawnPriority + ': Room [' + this.room.name + '] has less builders than miners.');
        nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'SCV', creepRole: 'builder'} );
    }

    // ----------------------------
    spawnPriority = 4;  // (lower is better)
    // ----------------------------

    // if we have no upgraders, spawn one
    if ( !this.creepTypeDistribution.roles.upgrader )
    {
        // console.log('contol.Population: Priority ' + spawnPriority + ': Room [' + this.room.name + '] has no dedicated upgrader creeps.');
        nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'SCV', creepRole: 'upgrader'} );
    }
    // Try to get a miner on each resource
    if ( this.creepTypeDistribution.roles.miner < (this.sources.length * 2) )
    {
        // console.log('contol.Population: Priority ' + spawnPriority + ': Room [' + this.room.name + '] has less miners than resource nodes.');
        nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'SEV', creepRole: 'miner'} );
    }
    
     ////Spawn repairers based on what needs repaired.
     var urgent_targets = this.room.find(FIND_STRUCTURES, {
         filter: (s) => s.hits <  s.hitsMax * 0.05});
        
     var targets = this.room.find(FIND_STRUCTURES, { filter: object => object.hits < ( object.hitsMax * 0.5 ) });

     
    if ( !this.creepTypeDistribution.roles.repairer || (this.creepTypeDistribution.roles.repairer < targets.length * .03))
    {

        // console.log('contol.Population: Priority ' + spawnPriority + ': Room [' + this.room.name + '] has no miner creeps. This will not stand!');
        nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'SCV', creepRole: 'repairer'} );
    }

    // ----------------------------
    spawnPriority = 9;  // (lower is better)
    // ----------------------------
    //Try out a few archers
    if (this.creepTypeDistribution.roles.archer <= 5) { 
    nextSpawns.push ( {spawnPriority: spawnPriority, creepType: 'AXE', creepRole: 'archer'} );
    }

    // Sort by priority, then return
    // var tmp = _(nextSpawns).sortBy('spawnPriority'); // Doesn't really work, tmp[0] returns undefined object
     //console.log('getNextSpawn: ' + JSON.stringify(nextSpawns[0]) );
    // console.log('getNextSpawn: sorted: ' + JSON.stringify(tmp) );
    // console.log('getNextSpawn: sorted (next): ' + JSON.stringify(tmp[0]) );

    return nextSpawns[0];
};

/**
 * Report on Population Status for this room.
 * @returns {Array}
 *      A list of strings, each is a line of text for the report.
 */
Population.prototype.Report =  function ()
{
    // Build a population Report
    var report = [];

    //Header
    report.push('---------- Population Report ----------');

    // Creep Distribution
    report.push('- Total Creeps: ' + this.creepTypeDistribution.total);
    var line = '';
    for (let n in this.creepTypeDistribution.roles)
    {
        line += ' (' + n + '): ' + this.creepTypeDistribution.roles[n];
    }
    report.push('-     Roles: ' + line );

    var n = this._getNextSpawn();
    if (n !== undefined)
    {
        report.push('- Next Creep: ' + n.creepRole);
    }
    else
    {
        report.push('- Next Creep: UnKnown.');
    }
    
   


    return report;
};

module.exports = Population ;


/* ** *** Private functions below *** ** */

/**
 * getCreepTypeDistribution - How many of each Type do I have?
 * @param {[]} creepList
 *  An Array of Game.Creep objects, like the one returned by Room.find(FIND_MY_CREEPS)
 * @returns {{}} creepTypeDistribution
 *  An object with the following properties:
 *      .total - integer, count of all creeps.
 *      .roles - object, properties of count per role name.
 *      .types - object, properties of count per body type.
 */
function getCreepTypeDistribution(creepList)
{
    var distribution = {};

    distribution['total'] = 0;
    distribution['roles'] = {};
    distribution['types'] = {};



    for(var name in creepList)
    {
        var creepRole = creepList[name].memory.role;
        var creepType = creepList[name].name.substring(1,4);

        //Make sure the entries exist:
        if (!distribution.roles[creepRole]) { distribution.roles[creepRole] = 0 }
        if (!distribution.types[creepType]) { distribution.types[creepType] = 0 }

        //Increment the relevant counters
        distribution.roles[creepRole] += 1 ;
        distribution.types[creepType] += 1;
        distribution['total'] += 1;
    }

    return distribution;

}


/**
 * nextCreep - Which Creep Should I spawn Next?
 *
 * @param {Room} room Game.Room object in which to spawn.
 * @returns {string} role The Role of the next Creep to spawn in this room
 */
function nextCreepRole(room)
{

    //console.log("determine next creep");
    var roomInfo = room.memory.roomInfo;
    var sources = roomInfo.sources;
    var spawns = roomInfo.spawns;
    var creepTypeDistribution = roomInfo.creepTypeDistribution;

    var nbrCreeps = creepTypeDistribution.total;
    var nbrSources = sources.length;

    var nbrMiners = creepTypeDistribution.roles['miner'] || 0;
    var nbrHaulers = creepTypeDistribution.roles['hauler'] || 0;
    var nbrBuilders = creepTypeDistribution.roles['builder'] || 0;
    var nbrUpgraders = creepTypeDistribution.roles['upgrader'] || 0;
    var nbrRepairers = creepTypeDistribution.roles['repairer'] || 0;

    // Creep spawning decisions.

    // Rule 1.  If we have *NO* creeps in this room.
    //          Assume start of game. Spawn a Harvester. This will get us started.
    if (nbrCreeps == 0) return 'harvester';

    // Rule 2. If we have no miners/haulers, make sure we have one of each.
    if ( nbrMiners == 0 ) return 'miner';
    if ( nbrHaulers == 0 ) return 'hauler';

    // Rule 3. If we have more miners than haulers, spawn an additional hauler
    if ( nbrMiners >  nbrHaulers ) return 'hauler';

    // Rule 4. If we have more miners than builders, spawn an additional builder
    if ( nbrMiners >  nbrBuilders ) return 'builder';

    // Rule 5. We should have 1 miner for each resource location
    if ( nbrSources > nbrMiners ) return 'miner';

    // Rule 6. We should have at least 1 upgrader
    if ( nbrUpgraders == 0 ) return 'upgrader';
    
    if ( nbrRepairers == 0 ) return 'repairer';

    // Rule 99. If you get here, there's nothing I can do for you.
    // return null;
}


function getNewCreepDetailsByRole(newCreepRole)
{
    var creepTypes = require('tmp.CreepTypes2'); //TODO replace with final once it works
    var newCreepType = {};

    for (let n in creepTypes)
    {
        if (creepTypes[n].roles.indexOf(newCreepRole) > -1 )
        {
            newCreepType = creepTypes[n];
            break;
        }
    }
    return newCreepType;
}

function getBestBody (creepType, maxCost)
{
    var finalBody = [];
    var finalTier = '';

    for (let tier in creepType.bodies)
    {
        if (getCreepCost(creepType.bodies[tier]) <= maxCost)
        {
            finalBody = creepType.bodies[tier];
            finalTier = tier;
        }
        else
        {
            // This one is too expensive, the last one saved will have to do
            break;
        }
    }

    // If we get here, finalBody should hold the most expensive we can build.
    creepType.tier = finalTier;
    return finalBody;
}

function getCreepCost(bodyParts)
{
    var cost = 0;

    for (let n in bodyParts)  { cost += BODYPART_COST[bodyParts[n]]}

    return cost;
}

function getFreeSpawner(room)
{
    var roomInfo = room.memory.roomInfo;
    var spawner = {};

    for (let n in roomInfo.spawns)
    {
        spawner = Game.getObjectById(roomInfo.spawns[n].id);
        if (!spawner.spawning) return spawner
    }

}