import {defs, tiny} from './examples/common.js';
import { Shape_From_File } from './examples/obj-file-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, Texture, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const {Textured_Phong} = defs

class Cube extends Shape {
    constructor() {
        super("position", "normal",);
        // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
        this.arrays.position = Vector3.cast(
            [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
            [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]);
            // define all corners of the cube and then when the program runs this part of the code, the program will connect 
            // the points that you define with a certain order 
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);
            // defines direction of the surface so program knows which surface to point outwards and in 
        // Arrange the vertices into a square shape in texture space too:
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
            // order to connect the points that are defined in the arrays position 
    }
}

export class Jungle extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        
        const horizon_row_op = (s, p) => p ? Mat4.translation(0, .2, 0).times(p.to4(1)).to3() : vec3(-50, 0, -50);
        const horizon_col_op = (t, p) => Mat4.translation(.2, 0, 0).times(p.to4(1)).to3();
        this.shapes = {
            sun: new defs.Subdivision_Sphere(4),
            planet_1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            runner: new defs.Subdivision_Sphere(4),
            cube: new defs.Cube(3,3),
            horizon: new defs.Grid_Patch(100, 500, horizon_row_op, horizon_col_op),
            tree_stump: new Shape_From_File("assets/treestump.obj"),
            character: new Shape_From_File("assets/character.obj"),
        };

        // *** Materials
        const bump = new defs.Fake_Bump_Map(1);
        this.materials = {
            sun: new Material(new defs.Phong_Shader(),
            {ambient: 1, diffusivity: 1, color: hex_color("#ffffff")}),
            planet_1: new Material(new defs.Phong_Shader(),
            {ambient: 0, diffusivity: 1, color: hex_color("#808080"), specularity: 0}),
            horizon: new Material(new Texture_Scroll_X(), {
       
                ambient: .6,
                texture: new Texture("assets/background.jpeg", "NEAREST")
            }),
            plastic: new Material(new defs.Phong_Shader(),
            {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
        }

<<<<<<< HEAD
        this.initial_camera_location = Mat4.look_at(vec3(0, 2, 13), vec3(0, 0, 0), vec3(0, 1, 0));
        this.horizon_transform = Mat4.identity().times(Mat4.scale(200, 130, 1)).times(Mat4.translation(0,0,-170));

        this.initial_camera_location = Mat4.look_at(vec3(0, 5, 12), vec3(0, 2, 0), vec3(0, 2, 0));
=======
        this.initial_camera_location = Mat4.look_at(vec3(0, 7, 12), vec3(0, 2, 0), vec3(0, 2, 0));
>>>>>>> origin/generate_boxes

        this.runner_position = Mat4.identity();
        this.runner_target_position = Mat4.identity();
        this.runner_interpolate_count = 0;
        this.runner_lane = 0;

        this.context = null;
        this.program_state = null;

        this.paused = true;
        this.velocity = 0;
        this.score = 0;
        this.alive = false;

        this.timer = 0;
        this.speed = 0.1;
        this.current_z = 0;
        this.tree_stumps = []; 
    }

    move_left(){
        if (this.runner_lane == 0 || this.runner_lane == 1) {
            this.runner_target_position = this.runner_target_position.times(Mat4.translation(-5,0,0));
            this.runner_interpolate_count -= 5;   
            this.runner_lane--;
        }
       
    }
    move_right(){
        if (this.runner_lane == 0 || this.runner_lane == -1) {
            this.runner_target_position = this.runner_target_position.times(Mat4.translation(5,0,0));
            this.runner_interpolate_count += 5;
            this.runner_lane++;
        }
    }

    gen_row_boxes(z_pos) {
        let x_positions = [-5, 0, 5]; 
        // gives either 1 or 2 so that we can render that many number of cubes 
        let random_num_for_stumps = Math.floor(Math.random() * 2) + 1;
        let current = []


        for (let i=0; i< random_num_for_stumps; i++){ 
            // generates a random index 0, 1, 2
            let random_x_pos_index = Math.floor(Math.random() * 3);
            // picks out -5, 0, 5 from random index 
            let random_x_position = x_positions[random_x_pos_index]; 
            // creates full coordinate scheme 
            let current_stump = {'x':random_x_position, 'y': 0, 'z': z_pos};
            current.push(current_stump)
            // adds coordiantes to an array 
        }
        this.tree_stumps.push(current);
        console.log(this.tree_stumps); 
    }    

    generate_all_stump_coordinates(){
        this.tree_stumps = [];
        for (let i = -15; i>=-225; i-=15){
            this.gen_row_boxes(i); 
        }
    }


    start_game (){ 
        this.paused = false; 
    }


    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("right", ["d"], () => this.move_right());
        this.key_triggered_button("left", ["a"], () => this.move_left());  
        this.key_triggered_button("generate stumps", ["g"], () => this.generate_all_stump_coordinates());  
    }

    display(context, program_state) {

        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {

            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_location);
        } 
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);
    
        const t = program_state.animation_time / 1000;
        const yellow = hex_color("#fac91a");
        let model_transform = Mat4.identity();

        let sun_transform = model_transform;

        // changing size 1-->3
        var sun_radius = 2 + Math.sin(2 * Math.PI/10 * t);
        sun_transform = sun_transform.times(Mat4.scale(sun_radius, sun_radius, sun_radius));

        // color changing with size
        var flashlight_color =  '#FFFFFF';
        const light_position = vec4(0, 0.5, 0, 1);
        program_state.lights = [new Light(light_position, hex_color(flashlight_color), 75 )];

        // Draw sun 
        // this.shapes.sun.draw(context, program_state, sun_transform, this.materials.sun.override({color: sun_color}));

        // //DRAWING PLANETS:
        // var planet_1_transform = model_transform;
        // planet_1_transform = planet_1_transform.times(Mat4.rotation(t,0,1,0)).times(Mat4.translation(5,0,0));
        // this.shapes.planet_1.draw(context, program_state, planet_1_transform, this.materials.planet_1);

        //move right
        if (this.runner_interpolate_count > 0) {
            this.runner_position = this.runner_position.times(Mat4.translation(1,0,0));
            this.runner_interpolate_count--;
        }//move left
        else if (this.runner_interpolate_count < 0) {
            this.runner_position = this.runner_position.times(Mat4.translation(-1,0,0));
            this.runner_interpolate_count++;
        }
        this.shapes.cube.draw(context, program_state, this.horizon_transform, this.materials.horizon);
        this.shapes.runner.draw(context, program_state, this.runner_position, this.materials.sun);

        //handle trees ***************
        let tree_transform = Mat4.identity(); 
        let len_stump_list = this.tree_stumps.length;

        this.timer += this.speed;
        this.current_z += this.speed;

<<<<<<< HEAD
        for (let i=0; i< len_stump_list -1; i++){
            this.tree_stumps[i].z += this.speed;   // 0.1 toward runner
            tree_transform = tree_transform.times(Mat4.translation(this.tree_stumps[i].x, 0, this.tree_stumps[i].z)); 
            this.shapes.tree_stump.draw(context, program_state, tree_transform, this.materials.plastic.override({color:hex_color('#804000')})); 
=======
        for (let i=0; i< len_stump_list ; i++){
            for (let j =0; j < this.tree_stumps[i].length; j++){
                this.tree_stumps[i][j].z += this.speed;   // 0.1 toward runner
                tree_transform = tree_transform.times(Mat4.translation(this.tree_stumps[i][j].x, 0, this.tree_stumps[i][j].z)); 
                this.shapes.tree_stump.draw(context, program_state, tree_transform, this.materials.plastic.override({color:hex_color('#9cfff2')})); 
                //tree_transform = tree_transform.times(Mat4.translation(-this.tree_stumps[i][j].x, 0, 0)); 
                tree_transform = Mat4.identity(); 
            }
>>>>>>> origin/generate_boxes
        }

        
        }
}
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