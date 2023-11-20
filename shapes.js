import {defs, tiny} from './examples/common.js';
const {
    Vector, Vector3, vec, vec3, vec4, color, Texture, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

const {Textured_Phong} = defs

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