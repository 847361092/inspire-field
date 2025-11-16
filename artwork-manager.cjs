#!/usr/bin/env node

/**
 * InspireField 作品管理器 - 博客式静态内容管理
 * 使用方法：
 * - node artwork-manager.js create    # 创建新作品
 * - node artwork-manager.js list      # 列出所有作品
 * - node artwork-manager.js update    # 更新作品信息
 * - node artwork-manager.js delete    # 删除作品
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const sharp = require('sharp');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const ARTWORKS_DIR = path.join(__dirname, 'public', 'artworks');
const CATEGORIES = ['mecha', 'concept', 'illustration', '3d', 'character', 'environment'];

// 创建作品目录名称（使用时间戳确保唯一性）
function createArtworkDirName(title) {
  const timestamp = Date.now();
  const sanitized = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  return `${sanitized}_${timestamp}`;
}

// 创建作品元数据
function createArtworkMetadata(info) {
  const now = new Date().toISOString();
  return `---
title: ${info.title}
description: ${info.description}
category: ${info.category}
tags: ${info.tags}
author:
  name: ${info.authorName}
  email: ${info.authorEmail || ''}
  website: ${info.authorWebsite || ''}
createdAt: ${now}
updatedAt: ${now}
featured: ${info.featured || false}
status: published
---

# ${info.title}

${info.description}

## 作品说明

${info.notes || '暂无说明'}

## 技术细节

- **使用软件**: ${info.software || '未提供'}
- **制作时间**: ${info.productionTime || '未提供'}
- **分辨率**: ${info.resolution || '未提供'}

## 作者简介

${info.authorBio || '暂无简介'}
`;
}

// 创建新作品
async function createArtwork() {
  console.log('\n📝 创建新作品\n');
  
  try {
    // 收集作品信息
    const info = {};
    info.title = await question('作品标题: ');
    info.description = await question('作品描述: ');
    
    console.log('\n可选分类: ' + CATEGORIES.join(', '));
    info.category = await question('作品分类: ');
    if (!CATEGORIES.includes(info.category)) {
      console.log(`⚠️  分类 "${info.category}" 不在预设列表中，将创建新分类`);
    }
    
    info.tags = await question('标签 (用逗号分隔): ');
    info.authorName = await question('作者名称: ');
    info.authorEmail = await question('作者邮箱 (可选): ');
    info.authorWebsite = await question('作者网站 (可选): ');
    info.authorBio = await question('作者简介 (可选): ');
    
    console.log('\n📋 技术信息 (可选)');
    info.software = await question('使用软件: ');
    info.productionTime = await question('制作时间: ');
    info.resolution = await question('分辨率: ');
    
    info.notes = await question('\n作品说明 (可选): ');
    
    const featured = await question('是否设为精选? (y/n): ');
    info.featured = featured.toLowerCase() === 'y';
    
    // 创建作品目录
    const dirName = createArtworkDirName(info.title);
    const categoryDir = path.join(ARTWORKS_DIR, info.category);
    const artworkDir = path.join(categoryDir, dirName);
    
    await fs.mkdir(artworkDir, { recursive: true });
    
    // 创建元数据文件
    const metadataPath = path.join(artworkDir, `${dirName}.md`);
    await fs.writeFile(metadataPath, createArtworkMetadata(info));
    
    console.log('\n✅ 作品创建成功！');
    console.log(`📁 目录位置: ${artworkDir}`);
    console.log('\n下一步:');
    console.log('1. 将作品图片复制到该目录');
    console.log('2. 图片命名为: image_1.webp, image_2.webp, ...');
    console.log('3. 如有作者头像，命名为: author.jpg');
    console.log('4. 运行 npm run build 构建项目');
    console.log('5. 提交到 Git 并推送，Vercel 会自动部署');
    
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
  }
}

// 列出所有作品
async function listArtworks() {
  console.log('\n📚 所有作品列表\n');
  
  try {
    const categories = await fs.readdir(ARTWORKS_DIR);
    let totalCount = 0;
    
    for (const category of categories) {
      const categoryPath = path.join(ARTWORKS_DIR, category);
      const stat = await fs.stat(categoryPath);
      
      if (stat.isDirectory()) {
        const artworks = await fs.readdir(categoryPath);
        const artworkDirs = [];
        
        for (const artwork of artworks) {
          const artworkPath = path.join(categoryPath, artwork);
          const artworkStat = await fs.stat(artworkPath);
          if (artworkStat.isDirectory()) {
            artworkDirs.push(artwork);
          }
        }
        
        if (artworkDirs.length > 0) {
          console.log(`\n📁 ${category} (${artworkDirs.length} 个作品)`);
          console.log('─'.repeat(40));
          
          for (const dir of artworkDirs) {
            // 尝试读取元数据
            const mdFiles = await fs.readdir(path.join(categoryPath, dir));
            const mdFile = mdFiles.find(f => f.endsWith('.md'));
            
            if (mdFile) {
              const content = await fs.readFile(
                path.join(categoryPath, dir, mdFile), 
                'utf-8'
              );
              const titleMatch = content.match(/title:\s*(.+)/);
              const title = titleMatch ? titleMatch[1] : dir;
              console.log(`  • ${title} (${dir})`);
            } else {
              console.log(`  • ${dir}`);
            }
            totalCount++;
          }
        }
      }
    }
    
    console.log('\n' + '═'.repeat(40));
    console.log(`总计: ${totalCount} 个作品`);
    
  } catch (error) {
    console.error('❌ 列出失败:', error.message);
  }
}

// 更新作品信息
async function updateArtwork() {
  console.log('\n✏️  更新作品信息\n');
  
  try {
    const category = await question('作品分类: ');
    const categoryPath = path.join(ARTWORKS_DIR, category);
    
    const artworks = await fs.readdir(categoryPath);
    console.log('\n该分类下的作品:');
    artworks.forEach((a, i) => console.log(`${i + 1}. ${a}`));
    
    const index = await question('\n选择要更新的作品编号: ');
    const artworkDir = artworks[parseInt(index) - 1];
    const artworkPath = path.join(categoryPath, artworkDir);
    
    // 读取现有元数据
    const mdFiles = await fs.readdir(artworkPath);
    const mdFile = mdFiles.find(f => f.endsWith('.md'));
    
    if (!mdFile) {
      console.log('❌ 未找到元数据文件');
      return;
    }
    
    const mdPath = path.join(artworkPath, mdFile);
    let content = await fs.readFile(mdPath, 'utf-8');
    
    console.log('\n当前内容预览:');
    console.log(content.substring(0, 500) + '...\n');
    
    const field = await question('要更新的字段 (title/description/tags/author): ');
    const newValue = await question('新值: ');
    
    // 更新字段
    const regex = new RegExp(`^${field}:.*$`, 'm');
    content = content.replace(regex, `${field}: ${newValue}`);
    
    // 更新 updatedAt
    content = content.replace(/updatedAt:.*/, `updatedAt: ${new Date().toISOString()}`);
    
    await fs.writeFile(mdPath, content);
    console.log('✅ 更新成功！');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  }
}

// 删除作品
async function deleteArtwork() {
  console.log('\n🗑️  删除作品\n');
  
  try {
    const category = await question('作品分类: ');
    const categoryPath = path.join(ARTWORKS_DIR, category);
    
    const artworks = await fs.readdir(categoryPath);
    console.log('\n该分类下的作品:');
    artworks.forEach((a, i) => console.log(`${i + 1}. ${a}`));
    
    const index = await question('\n选择要删除的作品编号: ');
    const artworkDir = artworks[parseInt(index) - 1];
    const artworkPath = path.join(categoryPath, artworkDir);
    
    const confirm = await question(`\n⚠️  确定要删除 "${artworkDir}" 吗? (yes/no): `);
    
    if (confirm.toLowerCase() === 'yes') {
      await fs.rm(artworkPath, { recursive: true, force: true });
      console.log('✅ 删除成功！');
    } else {
      console.log('❌ 已取消删除');
    }
    
  } catch (error) {
    console.error('❌ 删除失败:', error.message);
  }
}

// 主菜单
async function main() {
  console.log('\n');
  console.log('╔══════════════════════════════════════╗');
  console.log('║    InspireField 作品管理器 v2.0      ║');
  console.log('║        博客式静态内容管理系统         ║');
  console.log('╚══════════════════════════════════════╝');
  
  const command = process.argv[2];
  
  if (command) {
    // 命令行模式
    switch (command) {
      case 'create':
        await createArtwork();
        break;
      case 'list':
        await listArtworks();
        break;
      case 'update':
        await updateArtwork();
        break;
      case 'delete':
        await deleteArtwork();
        break;
      default:
        console.log('❌ 未知命令:', command);
        console.log('可用命令: create, list, update, delete');
    }
  } else {
    // 交互式菜单
    console.log('\n请选择操作:');
    console.log('1. 创建新作品');
    console.log('2. 列出所有作品');
    console.log('3. 更新作品信息');
    console.log('4. 删除作品');
    console.log('5. 退出');
    
    const choice = await question('\n选择 (1-5): ');
    
    switch (choice) {
      case '1':
        await createArtwork();
        break;
      case '2':
        await listArtworks();
        break;
      case '3':
        await updateArtwork();
        break;
      case '4':
        await deleteArtwork();
        break;
      case '5':
        console.log('👋 再见！');
        break;
      default:
        console.log('❌ 无效选择');
    }
  }
  
  rl.close();
}

// 运行主程序
main().catch(console.error);