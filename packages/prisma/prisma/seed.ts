import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	// Tシャツの初期在庫データを作成
	const colors = ["white", "black", "navy", "red"];
	const sizes = ["S", "M", "L", "XL"];

	for (const color of colors) {
		for (const size of sizes) {
			await prisma.inventory.upsert({
				where: {
					itemType_itemColor_itemSize: {
						itemType: "t-shirt",
						itemColor: color,
						itemSize: size,
					},
				},
				update: {},
				create: {
					itemType: "t-shirt",
					itemColor: color,
					itemSize: size,
					quantity: 100, // 初期在庫数
				},
			});
		}
	}

	console.log("初期在庫データを作成しました");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
