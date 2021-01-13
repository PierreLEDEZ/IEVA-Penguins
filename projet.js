
// ======================================================================================================================
// Spécialisation des classes Sim et Acteur pour un projet particulier
// ======================================================================================================================

function Appli(){
	Sim.call(this) ; 
}

Appli.prototype = Object.create(Sim.prototype) ; 
Appli.prototype.constructor = Appli ; 

Appli.prototype.creerScene = function(params){
	this.herbes = [];
	this.tuxs = [];
	params = params || {} ; 
	this.scene.add(new THREE.AxesHelper(3.0)) ; 
	this.scene.add(creerSol()) ; 

	var tux = new Acteur1("tux1",{path:"assets/obj/pingouin",obj:"penguin",mtl:"penguin"},this, 2) ; 
	this.addActeur(tux);
	this.tuxs.push(tux);
	var tux1 = new Acteur1("tux2",{path:"assets/obj/pingouin",obj:"penguin",mtl:"penguin"},this, 2) ; 
	this.addActeur(tux1);
	this.tuxs.push(tux1);

	//generate grass
	max = 50;
	min = -50;
	for (let i=0; i < 75; i++) {
		x = Math.floor(Math.random() * (max - min) ) + min;
		z = Math.floor(Math.random() * (max - min) ) + min;
		let temp_h = new Herbe("herbe"+i.toString(), {couleur: 0xaaff55}, this);
		console.log(this.acteurs);
		this.addActeur(temp_h);
		temp_h.setPosition(x, 0, z);
		temp_h.nimbus.placeNimbus();
		this.herbes.push(temp_h);
	}

	/*var herbe1 = new Herbe("herbe1",{couleur: 0xff0000},this) ; 
	this.addActeur(herbe1) ;

	var herbe2 = new Herbe("herbe2",{couleur:0xaaff55},this) ; 
	herbe2.setPosition(3,2,3) ; 
	this.addActeur(herbe2) ;*/

	/*let rocks = [];
	for (let i=0; i < 25; i++) {
		x = Math.floor(Math.random() * (max - min) ) + min;
		z = Math.floor(Math.random() * (max - min) ) + min;
		l = Math.floor(Math.random() * 7) + 2;
		p = Math.floor(Math.random() * 6) + 2;
		h = Math.floor(Math.random() * 4) + 1;
		let temp_r = new Rocher("rocher" + i.toString(), {largeur: l, profondeur: p, hauteur: h, couleur: 0x919191}, this);
		temp_r.setPosition(x, 0.75, z);
		this.addActeur(temp_r);
		rocks.push(temp_r);
	}*/
	//var rocher = new Rocher("rocher",{largeur:3,profondeur:2,hauteur:1.5,couleur:0x919191},this);
	//rocher.setPosition(-5,0.75,5) ; 
	//this.addActeur(rocher) ;
} 


// ========================================================================================================
function Nimbus(name, parent, sim, radius, height) {
	Acteur.call(this, name, {radius: radius, height: height}, sim);
	this.parent = parent;
	this.radius = radius;
	this.height = height;

	//var obj = createCylinder(name, radius, height);
	//this.setObjet3d(obj);
}
Nimbus.prototype = Object.create(Acteur.prototype);
Nimbus.prototype.constructor = Nimbus;

Nimbus.prototype.placeNimbus = function(dt) {
	this.setPosition(this.parent.getPosition().x, 0, this.parent.getPosition().z);
}

Nimbus.prototype.delete = function() {
	for (let i=0; i<this.sim.acteurs.length; i++) {
		if (this.sim.acteurs[i].nom === this.nom) {
			this.sim.acteurs.splice(i, 1);
			/*this.sim.scene.remove(this.objet3d);*/
			/*this.sim.acteurs[i].objet3d.geometry.dispose();
			this.sim.acteurs[i].objet3d.material.dispose();
			this.sim.acteurs[i].objet3d = undefined;*/
			return;
		}
	}
}

function Acteur1(nom,data,sim,vit){
	Acteur.call(this,nom,data,sim) ;
	this.clock = 0 

	this.state = 0;

	this.changeDirection = 0;
	this.speed = vit;

	this.pheromones = [];
	this.secretionTime = 0;
	this.findGrass = false;
	this.hungerLevel = 0;

	this.followPheromone = false;
	this.followPenguin = false;

	var repertoire = data.path + "/" ; 
	var fObj       = data.obj + ".obj" ; 
	var fMtl       = data.mtl + ".mtl" ; 

	var obj = chargerObj("tux1",repertoire,fObj,fMtl) ; 
	this.setObjet3d(obj) ;
	this.getNewTarget();
	this.objet3d.lookAt(this.target.x, 0, this.target.z);
	this.nimbus = new Nimbus("tux_nimbus", this, sim, 2.5, 4);
	sim.addActeur(this.nimbus);
	this.nimbus.placeNimbus();
}

Acteur1.prototype = Object.create(Acteur.prototype) ; 
Acteur1.prototype.constructor = Acteur1 ;

Acteur1.prototype.addPheromone = function(dt) {
	let pheromone = new Pheromone("Pheromone_"+Math.random().toString(36).substr(2, 14), this, sim, 2, 1, this.getPosition().x, 0.5, this.getPosition().z);
	this.sim.addActeur(pheromone);
	pheromone.setPosition(this.getPosition().x, 0.5, this.getPosition().z);
	this.pheromones.push(pheromone);
}

Acteur1.prototype.updatePheromones = function(dt) {
	for (let i=0; i<this.pheromones.length; i++) {
		this.pheromones[i].actualiser(dt);
	}
}

Acteur1.prototype.actualiser = function(dt){

	if (this.sim.controleur.showNimbus === true) {
		this.nimbus.objet3d.visible = true;
	} else {
		this.nimbus.objet3d.visible = false;
	}

	let time = this.sim.horloge;

	this.updateHunger(dt);

	this.spawnPheromone(time);

	this.updatePenguinState();

	if (this.state == 0) {
		this.checkPheromones();
		this.checkPenguins();
		if (!this.followPheromone && !this.followPenguin) {
			if (time - this.changeDirection > 5) {
				this.getNewTarget();
				this.changeDirection = time;
			}
		}
	} else if (this.state == 1) {
		this.checkGrass();
		if (!this.findGrass) {
			if (time - this.changeDirection > 5) {
				this.getNewTarget();
				this.changeDirection = time;
			}	
		}
	} else {
		this.getOppositeTarget();
	}

	this.checkFieldLimit();
	this.move(dt);
	this.nimbus.placeNimbus();
	this.updatePheromones(dt);
	this.updateOverlay();
}

Acteur1.prototype.getNewTarget = function(dt) {
	x = Math.floor(Math.random() * 100) - 50;
	z = Math.floor(Math.random() * 100) - 50;
	this.target = {"x": x, "y": 0, "z": z};
	this.objet3d.lookAt(this.target.x, 0, this.target.z);
}

Acteur1.prototype.updateHunger = function(dt) {
	this.hungerLevel += 2*dt;
}

Acteur1.prototype.spawnPheromone = function(time) {
	if (time - this.secretionTime > 0.2) {
		this.addPheromone();
		this.secretionTime = time;
	}
}

Acteur1.prototype.updatePenguinState = function(dt) {
	if (this.state == 0) {
		if (this.checkUser()) {
			this.state = 2;
		}
		if (this.hungerLevel > 10) {
			this.state = 1;
		}
	} else if (this.state == 1) {
		if (this.checkUser()) {
			this.state = 2;
		}
	} else if (this.state == 2) {
		if (this.checkUser()) {
			this.state = 2;
		} else {
			this.state = 0;
		}
	} else {
		console.log("Problem");
	}
}

Acteur1.prototype.checkPheromones = function(dt) {
	this.followPheromone = false;
	for (let i=0; i<this.sim.tuxs.length; i++) {
		penguin = this.sim.tuxs[i];
		if (penguin.name !== this.name) {
			for (let j=0; j<penguin.pheromones.length; j++) {
				phero = penguin.pheromones[j];
				if (Math.sqrt((phero.position.x-this.getPosition().x)**2 + (phero.position.z-this.getPosition().z)**2) < this.nimbus.radius) {
					this.followPheromone = true;
					this.target = {x: phero.position.x, y: 0, z: phero.position.z};
					this.objet3d.lookAt(this.target.x, 0, this.target.z);
					break;
				}
			}
		}
	}
}

Acteur1.prototype.checkPenguins = function(dt) {
	this.followPenguin = false;
	for (let i=0; i<this.sim.tuxs.length; i++) {
		penguin = this.sim.tuxs[i];
		if (penguin.name !== this.name) {
			let dist = Math.sqrt((penguin.position.x - this.getPosition().x)**2 + (penguin.position.z - this.getPosition().z)**2);
			if (dist <= (penguin.nimbus.radius + this.nimbus.radius)) {
				this.followPenguin = true;
				this.target = {x: penguin.getPosition().x, y: 0, z: penguin.getPosition().z};
				this.objet3d.lookAt(this.target.x, 0, this.target.z);
				break;
			}
		}
	}
}

Acteur1.prototype.checkUser = function(dt) {
	for (let i=0; i<this.sim.tuxs.length; i++) {
		let penguin = this.sim.tuxs[i];
		let dist = Math.sqrt((this.sim.controleur.position.x - penguin.getPosition().x)**2 + (this.sim.controleur.position.z - penguin.getPosition().z)**2);

		if (dist <= (penguin.nimbus.radius + this.sim.controleur.nimbus_radius)) {
			return true;
		}
	}
	return false;
}

Acteur1.prototype.getOppositeTarget = function(dt) {
	let new_x = 2*this.getPosition().x - this.target.x;
	let new_z = 2*this.getPosition().z - this.target.z;
	this.target = {x: new_x, y: 0, z: new_z};
	this.objet3d.lookAt(this.target.x, 0, this.target.z);
}





Acteur1.prototype.updateOverlay = function() {
	pos_x_overlay = document.getElementById("pos_x");
	pos_x_overlay.innerHTML = "X :" + this.sim.controleur.position.x;

	pos_z_overlay = document.getElementById("pos_z");
	pos_z_overlay.innerHTML = "Z :" + this.sim.controleur.position.z;

	target_overlay = document.getElementById("target");
	target_overlay.innerHTML = JSON.stringify(this.target);

	others_overlay = document.getElementById("others");
	if (this.state === 0) {
		others_overlay.innerHTML = "IDLE";
	} else if (this.state === 1) {
		others_overlay.innerHTML = "EAT";
	} else {
		others_overlay.innerHTML = "FLEE";
	}
}

Acteur1.prototype.move = function(dt) {
	this.objet3d.lookAt(this.target.x, 0, this.target.z);
	this.objet3d.translateZ(this.speed*dt);
}

Acteur1.prototype.checkFieldLimit = function(dt){
	let pos = this.getPosition();
	if (pos.x > 50 || pos.x < -50 || pos.z > 50 || pos.z < -50) {
		this.target = this.getTarget();
		this.objet3d.lookAt(this.target.x, 0, this.target.z);
	}
}

Acteur1.prototype.checkGrass = function(dt) {
	if (!this.findGrass) {
		for (let i=0; i<this.sim.herbes.length; i++) {
			xh = this.sim.herbes[i].getPosition().x;
			zh = this.sim.herbes[i].getPosition().z;
			dist = Math.sqrt((xh-this.getPosition().x)**2 + (zh-this.getPosition().z)**2)
			if (dist <= (this.sim.herbes[i].nimbus.radius + this.nimbus.radius)) {
				this.target = {x: xh,y: 0,z: zh};
				this.objet3d.lookAt(this.target.x, 0, this.target.z);
				this.findGrass = true;
				return;
			}
		}
	} else {
		for (let i=0; i<this.sim.herbes.length; i++) {
			xh = this.sim.herbes[i].getPosition().x;
			zh = this.sim.herbes[i].getPosition().z;
			dist = Math.sqrt((xh-this.getPosition().x)**2 + (zh-this.getPosition().z)**2)
			if (dist <= (this.sim.herbes[i].nimbus.radius)) {
				this.sim.herbes[i].delete();
				this.findGrass = false;
				this.state = 0;
				this.hungerLevel = 0;
				this.getNewTarget();
				this.objet3d.lookAt(this.target.x, 0, this.target.z);
				break;
			}
		}
	}
}

// La classe décrivant les touffes d'herbe
// =======================================

function Herbe(nom,data,sim){
	Acteur.call(this,nom,data,sim) ; 

	var rayon   = data.rayon || 0.25 ;  
	var couleur = data.couleur || 0x00ff00 ;  

	var sph = creerSphere(nom,{rayon:rayon, couleur:couleur}) ;
	this.setObjet3d(sph) ; 

	this.nimbus = new Nimbus("blabla", this, sim, 0.5, 0.5);
	sim.addActeur(this.nimbus);
	this.nimbus.placeNimbus();
}
Herbe.prototype = Object.create(Acteur.prototype) ; 
Herbe.prototype.constructor = Herbe ; 

Herbe.prototype.delete = function() {
	this.nimbus.delete();
	for (let i=0; i<this.sim.acteurs.length; i++) {
		if (this.sim.acteurs[i].nom === this.nom) {
			this.sim.acteurs.splice(i, 1);
			this.sim.scene.remove(this.objet3d);
			this.objet3d.geometry.dispose();
			this.objet3d.material.dispose();
			this.objet3d = undefined;
			break;
		}
	}
	for (let i=0; i<this.sim.herbes.length; i++) {
		if (this.sim.herbes[i].nom === this.nom) {
			this.sim.herbes.splice(i, 1);
			break;
		}
	}
}

// La classe décrivant les rochers
// ===============================

function Rocher(nom,data,sim){
	Acteur.call(this,nom,data,sim) ; 

	var l = data.largeur || 0.25 ;  
	var h = data.hauteur || 1.0 ; 
	var p = data.profondeur || 0.5 ;  
	var couleur = data.couleur || 0x00ff00 ;  

	var box = creerBoite(nom,{largeur:l, hauteur:h, profondeur:p, couleur:couleur}) ;
	this.setObjet3d(box) ; 
}
Rocher.prototype = Object.create(Acteur.prototype) ; 
Rocher.prototype.constructor = Rocher ; 

// =================================

function Pheromone(name, parent, sim, radius, age, x, y, z){
	Acteur.call(this,name, { "radius": radius, "age": age }, sim);

	this.age = 10 || age;
	this.max_age = this.age;
	this.color = 0x0000fe;
	this.radius = 0.5 ||  radius;
	this.parent = parent;
	this.position = {x: x, y: y, z: z};

	var sph = creerSphere(name,{rayon:this.radius, couleur:this.color});
	sph.material.transparent = true;
	sph.material.opacity = 1;
	this.setObjet3d(sph);
}
Pheromone.prototype = Object.create(Acteur.prototype) ;
Pheromone.prototype.constructor = Pheromone;

Pheromone.prototype.actualiser = function(dt){
	this.age -= 4*dt;
	let scale_factor = 5;
	this.objet3d.geometry.scale(1-dt/scale_factor,1-dt/scale_factor,1-dt/scale_factor);
	this.objet3d.material.opacity -= dt/4;
	if(this.age < 0) {
		this.delete();
	}
}

Pheromone.prototype.delete = function() {
	for (let i=0; i<this.sim.acteurs.length; i++) {
		if (this.sim.acteurs[i].nom === this.nom) {
			this.sim.acteurs.splice(i, 1);
			this.sim.scene.remove(this.objet3d);
			//this.objet3d.geometry.dispose();
			//this.objet3d.material.dispose();
			//this.objet3d = undefined;
			break;
		}
	}
}