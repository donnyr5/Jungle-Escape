import {defs, tiny} from './examples/common.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, Texture, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const {Textured_Phong} = defs

export class Text_Line extends Shape {                           // **Text_Line** embeds text in the 3D world, using a crude texture
    // method.  This Shape is made of a horizontal arrangement of quads.
    // Each is textured over with images of ASCII characters, spelling
    // out a string.  Usage:  Instantiate the Shape with the desired
    // character line width.  Then assign it a single-line string by calling
    // set_string("your string") on it. Draw the shape on a material
    // with full ambient weight, and text.png assigned as its texture
    // file.  For multi-line strings, repeat this process and draw with
    // a different matrix.
    constructor(max_size) {
            super("position", "normal", "texture_coord");
            this.max_size = max_size;
            var object_transform = Mat4.identity();
            for (var i = 0; i < max_size; i++) {                                       // Each quad is a separate Square instance:
                defs.Square.insert_transformed_copy_into(this, [], object_transform);
                object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
            }
        }

        set_string(line, context) {           // set_string():  Call this to overwrite the texture coordinates buffer with new
        // values per quad, which enclose each of the string's characters.
        this.arrays.texture_coord = [];
        for (var i = 0; i < this.max_size; i++) {
            var row = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16),
            col = Math.floor((i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16);

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,
            left = (col * size + skip) / dim, top = (row * size + skip) / dim,
            right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.arrays.texture_coord.push(...Vector.cast([left, 1 - bottom], [right, 1 - bottom],
            [left, 1 - top], [right, 1 - top]));
        }
        if (!this.existing) {
            this.copy_onto_graphics_card(context);
            this.existing = true;
        } else
            this.copy_onto_graphics_card(context, ["texture_coord"], false);
    }
}


export class Cube extends Shape {
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



export class RectangularPrism extends Shape {
    constructor(length = 2, width = 1, height = 1) {
        super("position", "normal");

        // Half dimensions for easier calculations
        var halfLength = length / 2;
        var halfWidth = width / 2;
        var halfHeight = height / 2;

        // Adjust the vertex positions based on length, width, and height
        this.arrays.position = Vector3.cast(
            [-halfWidth, -halfHeight, -halfLength], [halfWidth, -halfHeight, -halfLength], [-halfWidth, -halfHeight, halfLength], [halfWidth, -halfHeight, halfLength], // Bottom face vertices
            [halfWidth, halfHeight, -halfLength], [-halfWidth, halfHeight, -halfLength], [halfWidth, halfHeight, halfLength], [-halfWidth, halfHeight, halfLength],     // Top face vertices
            [-halfWidth, -halfHeight, -halfLength], [-halfWidth, -halfHeight, halfLength], [-halfWidth, halfHeight, -halfLength], [-halfWidth, halfHeight, halfLength], // Left face vertices
            [halfWidth, -halfHeight, halfLength], [halfWidth, -halfHeight, -halfLength], [halfWidth, halfHeight, halfLength], [halfWidth, halfHeight, -halfLength],     // Right face vertices
            [-halfWidth, -halfHeight, halfLength], [halfWidth, -halfHeight, halfLength], [-halfWidth, halfHeight, halfLength], [halfWidth, halfHeight, halfLength],     // Front face vertices
            [halfWidth, -halfHeight, -halfLength], [-halfWidth, -halfHeight, -halfLength], [halfWidth, halfHeight, -halfLength], [-halfWidth, halfHeight, -halfLength]); // Back face vertices

        // Normals should be the same as they are still aligned with the axes
        this.arrays.normal = Vector3.cast(
            [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0],
            [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
            [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0],
            [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
            [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1],
            [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]);

        // Indices remain the same as the cube
        this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
            14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
    }
}

export function boxesCollide3D(box1, box2) {
    // Each box is defined by top left front (x, y, z) and dimensions (width, height, depth)
    return (box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y &&
            box1.z < box2.z + box2.depth &&
            box1.z + box1.depth > box2.z);
}