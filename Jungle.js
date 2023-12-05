    import {defs, tiny} from './examples/common.js';
    import { Shape_From_File } from './examples/obj-file-demo.js';
    import { RectangularPrism, Cube, boxesCollide3D, Text_Line } from './shapes.js';
            const {
                Vector, Vector3, vec, vec3, vec4, color, Texture, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
            } = tiny;

            const {Textured_Phong} = defs

            export class Jungle extends Scene {
                constructor() {
                    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
                    super();
                    // At the beginning of our program, load one of each of these shape definitions onto the GPU.
                    
                    const horizon_row_op = (s, p) => p ? Mat4.translation(0, .2, 0).times(p.to4(1)).to3() : vec3(-50, 0, -50);
                    const horizon_col_op = (t, p) => Mat4.translation(.2, 0, 0).times(p.to4(1)).to3();
                    this.shapes = {
                        jumpBoost: new defs.Subdivision_Sphere(4),
                        runner: new Shape_From_File("assets/character-2.obj"),
                        cube: new defs.Cube(3,3),
                        coin: new defs.Subdivision_Sphere(4),
                        runner_hitbox: new RectangularPrism(.40,1,3.2),
                        stump_hitbox1: new RectangularPrism(4.2,3.4,0.75),
                        coin_hitbox: new RectangularPrism(1.5,1.5,0.55),
                        horizon: new defs.Grid_Patch(100, 500, horizon_row_op, horizon_col_op),
                        tree_stump: new Shape_From_File("assets/treestump.obj"),
                        score_text: new Text_Line(50),
                        begin_text: new Text_Line(50),
                    };

                    // *** Materials
                    const bump = new defs.Fake_Bump_Map(1);
                    this.materials = {
                        jumpBoost: new Material(new Gouraud_Shader(),
                        {ambient: .5, diffusivity: .5, color: hex_color("#3DED97"), specularity: 1}),
      
                        horizon: new Material(new Texture_Scroll_X(), {
                            ambient: .6,
                            texture: new Texture("assets/background.jpeg", "NEAREST")
                        }),
                        landingPage: new Material(new Texture_Scroll_X(), {
                            ambient: 0.8,
                            diffusivity: 0.3,
                            specularity: 1,
                            texture: new Texture("assets/jungle-2.jpg", "NEAREST")
                        }),
                        plastic: new Material(new defs.Phong_Shader(),
                        {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),

                        text_image: new Material(new defs.Textured_Phong(1), {
                            ambient: 1, diffusivity: .2, specularity: 0.2,
                            texture: new Texture("assets/text.png")
                        }),

                        coin: new Material(new defs.Phong_Shader(),
                        {ambient: .4, diffusivity: .6, color: hex_color("#FFD700")}),

                        tree_stump_texture: new Material(new defs.Textured_Phong(10), {
                            texture: new Texture("assets/tree_stump_texture.jpg"),
                            ambient: 1, diffusivity: 0, specularity: 0
                        }),
                        dirt: new Material(new Texture_Scroll_X(),
                        {
                            ambient: 1, diffusivity: 0.4, specularity: 0.1,
                            texture: new Texture("assets/dirt.jpg") // a shade of brown
                        }),
                    }

                    //sounds
                    this.background_sound = new Audio("assets/jungle.mp3");
                    this.background_playing = false;
                    this.death_sound = new Audio("assets/death_sound.mp3");
                    this.jump_sound = new Audio("assets/jump.mp3");
                    

                    // this.initial_camera_location = Mat4.look_at(vec3(0, 2, 13), vec3(0, 0, 0), vec3(0, 1, 0));
                    this.horizon_transform = Mat4.identity().times(Mat4.scale(200, 130, 1)).times(Mat4.translation(0,0,-170))
                    this.landingPage_transform = Mat4.identity().times(Mat4.translation(0, -20, -100)).times(Mat4.rotation(-13 * Math.PI / 180, 1, 0, 0)).times(Mat4.scale(85,80,1));
                    this.initial_camera_location = Mat4.look_at(vec3(0, 5, 12), vec3(0, 2, 0), vec3(0, 2, 0));
                    this.floor_transform = Mat4.identity().times(Mat4.translation(0, -20, 10)).times(Mat4.rotation(5 * Math.PI / 180, 1, 0, 0)).times(Mat4.scale(25,1, 25));

                    this.runner_position = Mat4.identity();
                    this.runner_target_position = Mat4.identity();
                    this.runner_interpolate_count = 0;
                    this.runner_lane = 0;
                    this.runner_position_x = 0;
                    this.runner_position_y = 0;

                    this.isJumping = false;
                    this.jump_boosts = 0;

                    this.context = null;
                    this.program_state = null;
                    this.started = false;
                    this.timer = 0;

                    this.paused = true;
                    this.score = 0;
                    this.alive = false;
                    this.over = false;

                    //GAME CONSTANT MODIFIERS:
                    this.INITIAL_SPEED = 0.4
                    this.TREE_SPACING = 36;
                    this.GRAVITY = -5.8;
                    this.JUMP_VELOCITY = 10;
                    this.SPEEDUP_FACTOR = 0.02;
                    this.JUMP_BOOST_SPAWN_RATE = 0.06; //1 = 100%, 0 = 0%
                    this.GOLD_SPAWN_RATE = 0.2;


                    //speed at which the game plays
                    this.speed = this.INITIAL_SPEED;
                    //used for tree generation
                    this.current_z = -10;   //to start
                    this.next_z = -15 * this.TREE_SPACING
                    this.tree_stumps = []; 


                    this.web_gl_created = false;
                    this.coin_hit = false;
                    this.top_score = 0;
                }




                rotate_camera_1(){
                    this.initial_camera_location = Mat4.look_at(vec3(0, 1, -8), vec3(0, -1, 0), vec3(0, 2, 0));
                }

                rotate_camera_2(){
                    this.initial_camera_location = Mat4.look_at(vec3(0, 12, 5), vec3(0, 2, 0), vec3(0, 2, 0));
                }

                move_left(){
                    if ((this.runner_lane == 0 || this.runner_lane == 1) && !this.paused && this.alive && (!this.isJumping)) {
                        this.runner_target_position = this.runner_target_position.times(Mat4.translation(-5,0,0));
                        this.runner_interpolate_count -= 5;  
                        this.runner_lane--;
                    }
                
                }
                move_right(){
                    if ((this.runner_lane == 0 || this.runner_lane == -1) && !this.paused && this.alive && (!this.isJumping)) {
                        this.runner_target_position = this.runner_target_position.times(Mat4.translation(5,0,0));
                        this.runner_interpolate_count += 5;
                        this.runner_lane++;
                    }
                }

                gen_row_boxes(z_pos) {
                    let x_positions = [-5, 0, 5]; 
                    // gives either 1 or 2 so that we can render that many number of cubes 
                    let random_num_for_stumps = Math.floor(Math.random() * 2) + 1.7;
                    let current = [];

                    //0-3 times
                    for (let i=0; i< random_num_for_stumps; i++){ 
                        // generates a random index 0, 1, 2
                        let random_x_pos_index = Math.floor(Math.random() * 3);
                        // picks out -5, 0, 5 from random index 
                        let random_x_position = x_positions[random_x_pos_index]; 
                        // creates full coordinate scheme 
                        let current_stump = {'x':random_x_position, 'y': 0, 'z': z_pos, 'type': "stump"};
                        current.push(current_stump);
                        // adds coordiantes to an array 
                    }

                    //Randomly generate a power up (jump_boost) ~ 1/20 chance
                     if ( Math.random() < this.JUMP_BOOST_SPAWN_RATE){
                        let random_x_pos_index = Math.floor(Math.random() * 3);
                        let random_x_position = x_positions[random_x_pos_index];
                        let jb = {'x':random_x_position, 'y': Math.floor(Math.random() * 3)+ 3 , 'z': z_pos, 'type': "jump_boost"};
                        current.push(jb);
                        // console.log("jump_boost created!")
                     }

                     if (Math.random() < this.GOLD_SPAWN_RATE){
                        let random_x_pos_index = Math.floor(Math.random() * 3);
                        let random_x_position = x_positions[random_x_pos_index];
                        let gold = {'x':random_x_position, 'y': Math.floor(Math.random() * 3)+ 3, 'z': z_pos, 'type': "coin"};
                        current.push(gold);
                     }

                    this.tree_stumps.push(current);
                    // console.log(this.tree_stumps); 
                }    

                generate_all_stump_coordinates(){
                    this.tree_stumps = [];
                    for (let i = -this.TREE_SPACING; i>= (-15*this.TREE_SPACING); i-=this.TREE_SPACING){
                        this.gen_row_boxes(i); 
                    }
                }

                start_game (){ 
                    this.score = 0;
                    this.generate_all_stump_coordinates();
                    this.runner_position = Mat4.identity();
                    this.runner_target_position = Mat4.identity();
                    this.runner_interpolate_count = 0;
                    this.runner_position_x = 0;
                    this.runner_position_y = 0;
                    this.runner_lane = 0;
                    this.current_z = -10;
                    this.next_z = -15 * this.TREE_SPACING;

                    this.paused = false; 
                    this.alive = true;
                    this.started = true;
                    this.over = false;
                    this.speed = this.INITIAL_SPEED;
                    this.GRAVITY = -5.8;
                    this.jump_boosts = 0;
                    this.coin_hit = false;

                    //play background music
                    this.background_sound.play(); 
                    this.background_playing = true;

                }

                pause_game(){
                    this.paused = !(this.paused);
                    if (this.background_playing == true){
                        this.background_sound.pause();
                    }
                    else {
                        this.background_sound.play();
                    }

                    //switch
                    this.background_playing = !(this.background_playing);
                }

                end_game(){
                    //perhaps show game over screen.
                    this.over = true;
                    this.paused = true; 
                    this.alive = false;
                    this.started = false;
                    this.background_sound.pause(); 
                    this.death_sound.play()
                    this.jump_boosts = 0;

                    if (this.score > this.top_score){
                        this.top_score = this.score
                    }

                    this.initial_camera_location = Mat4.look_at(vec3(0, 5, 12), vec3(0, 2, 0), vec3(0, 2, 0));
                }

                jump(){
                    //if not already jumping and not paused.
                    //must not be moving left or right as we jump.
                    if (this.isJumping == false && !this.paused && this.alive && this.runner_interpolate_count == 0){
                        this.isJumping = true;
                        this.jump_sound.play();
                        
                        //jump boost decided at jump time.
                        if (this.jump_boosts > 0){
                            this.GRAVITY = -3.5;
                            this.jump_boosts -= 1;
                        }
                        else {
                            this.GRAVITY = -5.8;
                        }

                        
                        // console.log("Jumped!");
                    }
                }

                //if power up, dont end game yet.
                stump_collision(){
                    this.end_game();
                }


                make_control_panel() {
                    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
                    this.key_triggered_button("right", ["d"], () => this.move_right());
                    this.key_triggered_button("left", ["a"], () => this.move_left());  
                    this.key_triggered_button("end", ["r"], () => this.end_game());
                    // this.key_triggered_button("roate camera 1", ["1"], () => this.rotate_camera_1());
                    this.key_triggered_button("top view", ["2"], () => this.rotate_camera_2());
                    this.key_triggered_button("Pause", ["p"], () => this.pause_game());
                    this.key_triggered_button("Jump", [" "], () => this.jump());
                }

                display(context, program_state) {

                    // display():  Called once per frame of animation.
                    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
                    if (!context.scratchpad.controls) {
                        // Define the global camera and projection matrices, which are stored in program_state.
                        program_state.set_camera(this.initial_camera_location);
                        var flashlight_color =  '#FFFFFF';
                        const light_position = vec4(0, 0.5, 0, 1);
                        program_state.lights = [new Light(light_position, hex_color(flashlight_color), 75 )];
                    } 
                    program_state.projection_transform = Mat4.perspective(
                        Math.PI / 4, context.width / context.height, .1, 1000);
                    const t = program_state.animation_time / 1000;
                    let model_transform = Mat4.identity();

                        if (!this.started){
                            this.shapes.cube.draw(context, program_state, this.landingPage_transform, this.materials.landingPage);
                        
                            //just creates the click event once.
                            if (!this.web_gl_created) {
                                let web_gl = document.getElementById("main-canvas");
                                web_gl.addEventListener('click', (e) => {
                                console.log("clicked!");
                                if (!this.started){
                                 this.start_game()   
                                }
                                
                               });
                               this.web_gl_created = true;
                            }

                            this.shapes.begin_text.set_string("Click anywhere to begin!" , context.context);
                            let begin_transform = Mat4.identity().times(Mat4.scale(0.4,0.4,0)).times(Mat4.translation(-17,10,0));
                            this.shapes.begin_text.draw(context, program_state, begin_transform, this.materials.text_image); 

                            var high_score_txt = Math.trunc(this.top_score);

                            this.shapes.score_text.set_string("High Score: " + high_score_txt.toString(), context.context);
                            let high_score_transform = Mat4.identity().times(Mat4.translation(-24,9,-25)).times(Mat4.rotation(0.4,-0.1,0,0)); 
                            this.shapes.score_text.draw(context, program_state, high_score_transform, this.materials.text_image); 
                            

                        } 
                        else {
            
                            this.shapes.cube.draw(context, program_state, this.horizon_transform, this.materials.horizon);
                            this.shapes.cube.draw(context, program_state, this.floor_transform, this.materials.dirt);
                            // this.shapes.runner.draw(context, program_state, this.runner_position, this.materials.sun);
                    
                            //person
                            this.shapes.runner.draw(context, program_state, this.runner_position, this.materials.plastic.override({color:hex_color('#804000')})); 

                                                        // SCORE ++++++++++++++++++++++++++++++++
                            // set score matrix 
                            let score_transform = Mat4.identity(); 
                            score_transform = score_transform.times(Mat4.translation(-24,9,-25)).times(Mat4.rotation(0.4,-0.1,0,0)); 
                            // turn score into single rounded integer and store correctly 
                            var score_txt = Math.trunc(this.score);
                            this.shapes.score_text.set_string("Score:" + score_txt.toString(), context.context);
                            // draw score 
                            this.shapes.score_text.draw(context, program_state, score_transform, this.materials.text_image); 
                            

                            //draw the jump boost count
                                this.shapes.score_text.set_string("Jump Boosts:" + this.jump_boosts.toString(), context.context);
                                let jb_transform = model_transform.times(Mat4.scale(0.25,0.25,0)).times(Mat4.translation(14,25.5,0));
                                this.shapes.score_text.draw(context, program_state, jb_transform, this.materials.text_image);
                            
                            if (this.paused){
                                //paused screen
                                let tree_transform = Mat4.identity(); 
                                let len_stump_list = this.tree_stumps.length;
                                

                                //show objects
                                for (let i=0; i< len_stump_list ; i++){
                                    for (let j =0; j < this.tree_stumps[i].length; j++){
                                      
                                        tree_transform = tree_transform.times(Mat4.translation(this.tree_stumps[i][j].x, this.tree_stumps[i][j].y, this.tree_stumps[i][j].z)); 
    
                                        if ( this.tree_stumps[i][j].type == "stump"){
                                           this.shapes.tree_stump.draw(context, program_state, tree_transform, this.materials.tree_stump_texture); 
                                        }
                                            
                                        if (this.tree_stumps[i][j].type == "jump_boost"){
                                            this.shapes.jumpBoost.draw(context,program_state, tree_transform, this.materials.jumpBoost);
                                        }

                                        if (this.tree_stumps[i][j].type == "coin" ){
                                            let coin_transform = tree_transform.times(Mat4.scale(0.25,0.25,0.25));
                                            this.shapes.coin.draw(context,program_state, coin_transform, this.materials.coin);
                                        }
                                        tree_transform = Mat4.identity(); 
                                    }
                                }
                            }
                 
                            if (!this.paused){
                                //move right
                            if (this.runner_interpolate_count > 0) {
                                this.runner_position = this.runner_position.times(Mat4.translation(0.5,0,0));
                                this.runner_interpolate_count -= 1/2;
                                this.runner_position_x += 1/2;
                            }//move left
                            else if (this.runner_interpolate_count < 0) {
                                this.runner_position = this.runner_position.times(Mat4.translation(-0.5,0,0));
                                this.runner_interpolate_count += 1/2;
                                this.runner_position_x-= 1/2;
                            }
                            //jump
                            if (this.isJumping == true){
                                //fix the jump height
                                this.runner_position = this.runner_position.times(Mat4.translation(0,-this.runner_position_y,0));

                                this.runner_position_y = this.GRAVITY * (this.timer ** 2) + this.JUMP_VELOCITY * this.timer;
                                this.timer += 0.05;
                                if (this.runner_position_y >= 0){
                                    this.runner_position = this.runner_position.times(Mat4.translation(0,this.runner_position_y,0));
                                }
                                else {
                                    this.runner_position_y = 0;
                                    this.isJumping = false;
                                    this.timer = 0;
                                    //jump has finished
                                }
                            }

                    
                            //handle trees ***************
                            let tree_transform = Mat4.identity(); 
                            let len_stump_list = this.tree_stumps.length;
                    
                            this.score += 0.1 * this.speed;  
                            this.current_z += this.speed; 
                    
                            //check for new row 
                            if (this.current_z >= this.TREE_SPACING){
                                this.gen_row_boxes(this.next_z);
                                this.tree_stumps.shift();
                                this.current_z = -1;
                                // console.log("removed row and genereated new!");

                                this.speed+= this.SPEEDUP_FACTOR;
                            }

                    
                            for (let i=0; i< len_stump_list ; i++){
                                for (let j =0; j < this.tree_stumps[i].length; j++){
                                    this.tree_stumps[i][j].z += this.speed;   // 0.1 toward runner
                                    tree_transform = tree_transform.times(Mat4.translation(this.tree_stumps[i][j].x, this.tree_stumps[i][j].y, this.tree_stumps[i][j].z)); 

                                    if ( this.tree_stumps[i][j].type == "stump"){
                                       this.shapes.tree_stump.draw(context, program_state, tree_transform, this.materials.tree_stump_texture); 
                                    }
                                        

                                    if (this.tree_stumps[i][j].type == "jump_boost"){
                                        this.shapes.jumpBoost.draw(context,program_state, tree_transform, this.materials.jumpBoost);
                                    }

                                    if (this.tree_stumps[i][j].type == "coin" ){
                                        let coin_transform = tree_transform.times(Mat4.scale(0.6,0.6,0.6));
                                        this.shapes.coin.draw(context,program_state, coin_transform, this.materials.coin);                                    }

                                    tree_transform = Mat4.identity(); 
                                }
                            }
            
                            //handle collisions here
                            //we should only have to check the first 2 rows of tree_stumps to see if there is any overlap
                            for (let i = 0; i < 2; i++){
                                for (let j =0; j < this.tree_stumps[i].length; j++){
                                    let stump1_collision_box = {};
                                    //runner hit box (need to factor in Y change during jump) TOP LEFT.
                                    if (this.tree_stumps[i][j].type == "jump_boost"){
                                        stump1_collision_box = {'x': 0.2 + this.tree_stumps[i][j].x, 'y': this.tree_stumps[i][j].y+1.5, 'z': this.tree_stumps[i][j].z - 2, 'width': 3.4, 'depth': 4.2,'height': 0.75}
                                    }
                                    if (this.tree_stumps[i][j].type == "stump"){
                                        stump1_collision_box = {'x': 0.2 + this.tree_stumps[i][j].x, 'y': this.tree_stumps[i][j].y+1.5, 'z': this.tree_stumps[i][j].z - 2, 'width': 3.4, 'depth': 4.2,'height': 0.75}
                                    }

                                    if (this.tree_stumps[i][j].type == "coin"){
                                        stump1_collision_box = {'x': 0.2 + this.tree_stumps[i][j].x, 'y': this.tree_stumps[i][j].y+1.5, 'z': this.tree_stumps[i][j].z - 1, 'width': 1.5, 'depth': 1.5,'height': 0.55}
                                    }
                                    //stump_hitbox1: top left corner, dimensions
                                    let runner_collision_box = {'x': + this.runner_position_x, 'y': this.runner_position_y, 'z': 0, 'width': 1, 'depth': 0.4,'height': 4.2}

                                // TO DRAW THE HITBOXES TOO
                                    // let hitbox_transform = model_transform;
                                    // hitbox_transform = hitbox_transform.times(Mat4.translation(stump1_collision_box.x, stump1_collision_box.y-1.5, stump1_collision_box.z+2.5));
                                    // this.shapes.stump_hitbox1.draw(context,program_state,hitbox_transform,this.materials.jumpBoost);
                                    
                                    // let runner_hitbox_transform = model_transform;
                                    // runner_hitbox_transform = runner_hitbox_transform.times(Mat4.translation(runner_collision_box.x, runner_collision_box.y, runner_collision_box.z));
                                    // this.shapes.runner_hitbox.draw(context,program_state,runner_hitbox_transform,this.materials.jumpBoost);

                                    if (boxesCollide3D(stump1_collision_box,runner_collision_box)){
                                        if (this.tree_stumps[i][j].type == "stump"){
                                            console.log("Hit!");  
                                            console.log("Score: ", this.score);
                                            this.stump_collision(); //handles (ends the game for now)   
                                        }
                                        if (this.tree_stumps[i][j].type == "jump_boost") {
                                            console.log("Boost activated!");
                                            this.jump_boosts = 5;
                                            this.tree_stumps[i][j].type = "dead"
                                        }   

                                        if (this.tree_stumps[i][j].type == "coin") {
                                            console.log("coin hit!!");
                                            this.score += 10  
                                            this.tree_stumps[i][j].type = "dead"
                                            //no longer handle collisions with this
                                        } 
                                    }
                                }
                            }//end loop

                            }//end paused (things that happen when game is going)
                        }// end started

                } //end display
            } //end Jungle Class

            class Gouraud_Shader extends Shader {
                // This is a Shader using Phong_Shader as template
                // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

                constructor(num_lights = 2) {
                    super();
                    this.num_lights = num_lights;
                }

                shared_glsl_code() {
                    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
                    return ` 
                    precision mediump float;
                    const int N_LIGHTS = ` + this.num_lights + `;
                    uniform float ambient, diffusivity, specularity, smoothness;
                    uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
                    uniform float light_attenuation_factors[N_LIGHTS];
                    uniform vec4 shape_color;
                    uniform vec3 squared_scale, camera_center;

                    // Specifier "varying" means a variable's final value will be passed from the vertex shader
                    // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
                    // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
                    varying vec3 N, vertex_worldspace;
                    varying vec4 vertex_color;

                    // ***** PHONG SHADING HAPPENS HERE: *****                                       
                    vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
                        // phong_model_lights():  Add up the lights' contributions.
                        vec3 E = normalize( camera_center - vertex_worldspace );
                        vec3 result = vec3( 0.0 );
                        for(int i = 0; i < N_LIGHTS; i++){
                            // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                            // light will appear directional (uniform direction from all points), and we 
                            // simply obtain a vector towards the light by directly using the stored value.
                            // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                            // the point light's location from the current surface point.  In either case, 
                            // fade (attenuate) the light as the vector needed to reach it gets longer.  
                            vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                                        light_positions_or_vectors[i].w * vertex_worldspace;                                             
                            float distance_to_light = length( surface_to_light_vector );

                            vec3 L = normalize( surface_to_light_vector );
                            vec3 H = normalize( L + E );
                            // Compute the diffuse and specular components from the Phong
                            // Reflection Model, using Blinn's "halfway vector" method:
                            float diffuse  =      max( dot( N, L ), 0.0 );
                            float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                            float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                            
                            vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                                    + light_colors[i].xyz * specularity * specular;
                            result += attenuation * light_contribution;
                        }
                        return result;
                    } `;
                }

                vertex_glsl_code() {
                    // ********* VERTEX SHADER *********
                    return this.shared_glsl_code() + `
                        attribute vec3 position, normal;                            
                        // Position is expressed in object coordinates.
                        
                        uniform mat4 model_transform;
                        uniform mat4 projection_camera_model_transform;
                
                        void main(){                                                                   
                            // The vertex's final resting place (in NDCS):
                            gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                            // The final normal vector in screen space.
                            N = normalize( mat3( model_transform ) * normal / squared_scale);
                            vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;

                            vertex_color = vec4(shape_color.xyz * ambient, shape_color.w);
                            vertex_color.xyz += phong_model_lights(N, vertex_worldspace);
                        } `;
                }

                fragment_glsl_code() {
                    // ********* FRAGMENT SHADER *********
                    // A fragment is a pixel that's overlapped by the current triangle.
                    // Fragments affect the final image or get discarded due to depth.
                    return this.shared_glsl_code() + `
                        void main(){
                            gl_FragColor = vertex_color;
                            return;
                        } `;
                }

                send_material(gl, gpu, material) {
                    // send_material(): Send the desired shape-wide material qualities to the
                    // graphics card, where they will tweak the Phong lighting formula.
                    gl.uniform4fv(gpu.shape_color, material.color);
                    gl.uniform1f(gpu.ambient, material.ambient);
                    gl.uniform1f(gpu.diffusivity, material.diffusivity);
                    gl.uniform1f(gpu.specularity, material.specularity);
                    gl.uniform1f(gpu.smoothness, material.smoothness);
                }

                send_gpu_state(gl, gpu, gpu_state, model_transform) {
                    // send_gpu_state():  Send the state of our whole drawing context to the GPU.
                    const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
                    gl.uniform3fv(gpu.camera_center, camera_center);
                    // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
                    const squared_scale = model_transform.reduce(
                        (acc, r) => {
                            return acc.plus(vec4(...r).times_pairwise(r))
                        }, vec4(0, 0, 0, 0)).to3();
                    gl.uniform3fv(gpu.squared_scale, squared_scale);
                    // Send the current matrices to the shader.  Go ahead and pre-compute
                    // the products we'll need of the of the three special matrices and just
                    // cache and send those.  They will be the same throughout this draw
                    // call, and thus across each instance of the vertex shader.
                    // Transpose them since the GPU expects matrices as column-major arrays.
                    const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
                    gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
                    gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

                    // Omitting lights will show only the material color, scaled by the ambient term:
                    if (!gpu_state.lights.length)
                        return;

                    const light_positions_flattened = [], light_colors_flattened = [];
                    for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
                        light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
                        light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
                    }
                    gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
                    gl.uniform4fv(gpu.light_colors, light_colors_flattened);
                    gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
                }

                update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
                    // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
                    // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
                    // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
                    // program (which we call the "Program_State").  Send both a material and a program state to the shaders
                    // within this function, one data field at a time, to fully initialize the shader for a draw.

                    // Fill in any missing fields in the Material object with custom defaults for this shader:
                    const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
                    material = Object.assign({}, defaults, material);

                    this.send_material(context, gpu_addresses, material);
                    this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
                }
            }

            class Ring_Shader extends Shader {
                update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
                    // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
                    const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
                        PCM = P.times(C).times(M);
                    context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
                    context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
                        Matrix.flatten_2D_to_1D(PCM.transposed()));
                }

                shared_glsl_code() {
                    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
                    return `
                    precision mediump float;
                    varying vec4 point_position;
                    varying vec4 center;
                    `;
                }

                vertex_glsl_code() {
                    // ********* VERTEX SHADER *********
                    // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
                    return this.shared_glsl_code() + `
                    attribute vec3 position;
                    uniform mat4 model_transform;
                    uniform mat4 projection_camera_model_transform;
                    
                    void main(){
                    center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);
                    point_position = model_transform * vec4(position, 1.0);
                    gl_Position = projection_camera_model_transform * vec4(position, 1.0);          
                    }`;
                }

                fragment_glsl_code() {
                    // ********* FRAGMENT SHADER *********
                    // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
                    return this.shared_glsl_code() + `
                    void main(){
                        float scalar = sin(18.01 * distance(point_position.xyz, center.xyz));
                        gl_FragColor = scalar * vec4(0.6078, 0.3961, 0.098, 1.0);
                    }`;
                }
            }
            class Texture_Scroll_X extends Textured_Phong {
                fragment_glsl_code() {
                    return this.shared_glsl_code() + `
                        varying vec2 f_tex_coord;
                        uniform sampler2D texture;
                        uniform float animation_time;
                        
                        void main(){
                            // Sample the texture image in the correct place:
                            vec2 temp = f_tex_coord;
                            temp.x = temp.x-0.01 * mod(animation_time, 20.0);
                            vec4 tex_color = texture2D(texture, temp);
                            if( tex_color.w < .01 ) discard;
                            gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                                    // Compute the final color with contributions from lights:
                            gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                    } `;
                }
            }