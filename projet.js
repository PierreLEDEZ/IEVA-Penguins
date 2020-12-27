
// ======================================================================================================================
// Spécialisation des classes Sim et Acteur pour un projet particulier
// ======================================================================================================================

function Appli(){
	Sim.call(this) ; 
}

Appli.prototype = Object.create(Sim.prototype) ; 
Appli.prototype.constructor = Appli ; 

Appli.prototype.creerScene = function(params){
	params = params || {} ; 
	this.scene.add(new THREE.AxesHelper(3.0)) ; 
	this.scene.add(creerSol()) ; 

	var tux = new Acteur1("tux1",{path:"assets/obj/pingouin",obj:"penguin",mtl:"penguin"},this, 5) ; 
	this.addActeur(tux);

	//generate grass
	let herbes = [];
	max = 50;
	min = -50;
	for (let i=0; i < 200; i++) {
		x = Math.floor(Math.random() * (max - min) ) + min;
		z = Math.floor(Math.random() * (max - min) ) + min;
		let temp_h = new Herbe("herbe"+i.toString(), {couleur: 0xaaff55}, this);
		this.addActeur(temp_h);
		temp_h.setPosition(x, 0, z);
		temp_h.initNimbus();
		herbes.push(temp_h);
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

	var obj = createCylinder(name, radius, height);
	this.setObjet3d(obj);
}
Nimbus.prototype = Object.create(Acteur.prototype);
Nimbus.prototype.constructor = Nimbus;

function Acteur1(nom,data,sim,vit){
	Acteur.call(this,nom,data,sim) ;
	this.clock = 0 

	this.speed = vit;
	this.vit_x = vit;
	this.vit_z = vit;
	this.vitesse = new THREE.Vector3(this.vit_x, 0, this.vit_z);

	var repertoire = data.path + "/" ; 
	var fObj       = data.obj + ".obj" ; 
	var fMtl       = data.mtl + ".mtl" ; 

	var obj = chargerObj("tux1",repertoire,fObj,fMtl) ; 
	this.setObjet3d(obj) ;
	this.target = this.getTarget();
	this.objet3d.lookAt(this.target.x, 0, this.target.z);
	this.ninbus = new Nimbus("blabla", this, sim, 1.5, 4);
	sim.addActeur(this.ninbus);
	this.ninbus.setPosition(this.getPosition().x, 0, this.getPosition().z);
}

Acteur1.prototype = Object.create(Acteur.prototype) ; 
Acteur1.prototype.constructor = Acteur1 ; 

Acteur1.prototype.actualiser = function(dt){
	//console.log(this.sim.horloge);
	if (Math.random() > 0.95) {
		console.log("Acquiring new target");
		this.target = this.getTarget();
		this.objet3d.lookAt(this.target.x, 0, this.target.z);
	}
	this.check();
	this.move(dt);
	this.ninbus.setPosition(this.getPosition().x, 0, this.getPosition().z);
	//this.setOrientation(t) ;  
	//this.setPosition(2*Math.sin(t),0.0,3*Math.cos(2*t)) ; 
}

Acteur1.prototype.move = function(dt) {
	let pos = this.getPosition();
	this.objet3d.translateZ(this.speed*dt);
	//this.setPosition(pos.x+this.vit_x, 0.5, pos.z+this.vit_z);
}

Acteur1.prototype.getTarget = function(dt) {
	x = Math.floor(Math.random() * 100) - 50;
	z = Math.floor(Math.random() * 100) - 50;
	return {"x": x, "y": 0, "z": z};
}

Acteur1.prototype.check = function(dt){
	let pos = this.getPosition();
	let out = false;

	if (pos.x > 50) {
		out = true;
		this.vit_x = -this.vit_x;
	}
	if (pos.x < -50) {
		out = true;
		this.vit_x = -this.vit_x;
	}
	if (pos.z > 50) {
		out = true;
		this.vit_z = -this.vit_z;
	}
	if (pos.z < 50) {
		out = true;
		this.vit_z = -this.vit_z;
	}
	if (out) {
		this.target = this.getTarget();
	}
	this.vitesse = new THREE.Vector3(this.vit_x, 0, this.vit_z);
}

// La classe décrivant les touffes d'herbe
// =======================================

function Herbe(nom,data,sim){
	Acteur.call(this,nom,data,sim) ; 

	var rayon   = data.rayon || 0.25 ;  
	var couleur = data.couleur || 0x00ff00 ;  

	var sph = creerSphere(nom,{rayon:rayon, couleur:couleur}) ;
	this.setObjet3d(sph) ; 

	this.ninbus = new Nimbus("blabla", this, sim, 0.5, 0.5);
	sim.addActeur(this.ninbus);
}
Herbe.prototype = Object.create(Acteur.prototype) ; 
Herbe.prototype.constructor = Herbe ; 

Herbe.prototype.initNimbus = function(dt) {
	this.ninbus.setPosition(this.getPosition().x, 0, this.getPosition().z);
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






