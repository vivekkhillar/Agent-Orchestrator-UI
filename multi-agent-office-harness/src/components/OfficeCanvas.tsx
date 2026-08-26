import React, { useRef, useEffect, useState } from 'react';
import { Agent, OfficeRoom, OfficeDesk } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Shield, Sparkles } from 'lucide-react';

interface OfficeCanvasProps {
  agents: Agent[];
  rooms: OfficeRoom[];
  desks: OfficeDesk[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  onAgentMove?: (agentId: string, x: number, y: number) => void;
  simulationSpeed: number;
  activeMovementStage?: string | null;
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = ({
  agents,
  rooms,
  desks,
  selectedAgentId,
  onSelectAgent,
  onAgentMove,
  simulationSpeed,
  activeMovementStage
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  // Animation frame loop for rendering retro pixel office
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;

      // Base Floor - Vintage retro green tile pattern
      ctx.fillStyle = '#6b8e78';
      ctx.fillRect(0, 0, width, height);

      // Floor grid tiles
      const tileSize = 24;
      ctx.strokeStyle = '#5f806c';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render Each Room Section
      rooms.forEach((room) => {
        // Room Floor Surface
        ctx.fillStyle = room.floorColor || '#8bb49c';
        ctx.fillRect(room.x, room.y, room.width, room.height);

        // Tile highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let rx = room.x; rx <= room.x + room.width; rx += tileSize) {
          ctx.beginPath();
          ctx.moveTo(rx, room.y);
          ctx.lineTo(rx, room.y + room.height);
          ctx.stroke();
        }
        for (let ry = room.y; ry <= room.y + room.height; ry += tileSize) {
          ctx.beginPath();
          ctx.moveTo(room.x, ry);
          ctx.lineTo(room.x + room.width, ry);
          ctx.stroke();
        }

        // Room Partition Walls (White walls with black/grey outlines)
        drawRoomWalls(ctx, room);

        // Room Furniture & Objects
        drawRoomDecor(ctx, room, tick);
      });

      // Draw Workstation Desks
      desks.forEach((desk) => {
        drawDesk(ctx, desk, tick);
      });

      // Draw Path Waypoints & Active Movement Trails
      agents.forEach((agent) => {
        const isMoving = agent.state === 'walking' || 
                         agent.state === 'walking_to_boss' || 
                         agent.state === 'walking_to_desk' || 
                         agent.state === 'walking_to_postgres' ||
                         agent.state === 'walking_to_submit';
        
        if (isMoving && (Math.abs(agent.x - agent.targetX) > 2 || Math.abs(agent.y - agent.targetY) > 2)) {
          drawMovementTrail(ctx, agent, tick);
        }
      });

      // Sort Agents by Y position for proper isometric depth layering
      const sortedAgents = [...agents].sort((a, b) => a.y - b.y);

      // Render Agents
      sortedAgents.forEach((agent) => {
        drawAgent(ctx, agent, agent.id === selectedAgentId, tick);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [agents, rooms, desks, selectedAgentId, zoom]);

  // Click on Canvas to select agent or command move
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked an agent
    const clickedAgent = agents.find((agent) => {
      const dist = Math.hypot(agent.x - clickX, agent.y - clickY);
      return dist <= 28;
    });

    if (clickedAgent) {
      onSelectAgent(clickedAgent.id);
    } else {
      if (selectedAgentId && onAgentMove) {
        onAgentMove(selectedAgentId, Math.round(clickX), Math.round(clickY));
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const hovered = agents.find((agent) => {
      const dist = Math.hypot(agent.x - mouseX, agent.y - mouseY);
      return dist <= 26;
    });
    setHoveredAgent(hovered || null);
  };

  // Helper to draw realistic retro room walls with door openings
  const drawRoomWalls = (ctx: CanvasRenderingContext2D, room: OfficeRoom) => {
    const x = room.x;
    const y = room.y;
    const w = room.width;
    const h = room.height;

    // Wall thickness & color
    ctx.fillStyle = '#f8fafc'; // White retro partition wall
    ctx.strokeStyle = '#334155'; // Dark border outline
    ctx.lineWidth = 2.5;

    // Top wall
    ctx.fillRect(x, y, w, 14);
    ctx.strokeRect(x, y, w, 14);
    // Wall shadow
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x, y + 14, w, 4);

    // Left wall
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, 10, h);
    ctx.strokeRect(x, y, 10, h);

    // Right wall (with door gap if needed)
    if (room.type === 'director') {
      // Boss Cabin has door gap at bottom right
      ctx.fillRect(x + w - 10, y, 10, h - 45);
      ctx.strokeRect(x + w - 10, y, 10, h - 45);
      // Door threshold floor mat
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + w - 10, y + h - 45, 10, 45);
    } else {
      ctx.fillRect(x + w - 10, y, 10, h);
      ctx.strokeRect(x + w - 10, y, 10, h);
    }

    // Bottom wall (with door cutouts)
    if (room.type === 'director') {
      // Bottom wall leaving door opening on right
      ctx.fillRect(x, y + h - 10, w - 45, 10);
      ctx.strokeRect(x, y + h - 10, w - 45, 10);
      // Doorway entrance indicator
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + w - 45, y + h - 4, 45, 4);
    } else if (room.type === 'conference') {
      // Bottom wall with center door opening
      ctx.fillRect(x, y + h - 10, w / 2 - 25, 10);
      ctx.strokeRect(x, y + h - 10, w / 2 - 25, 10);
      ctx.fillRect(x + w / 2 + 25, y + h - 10, w / 2 - 25, 10);
      ctx.strokeRect(x + w / 2 + 25, y + h - 10, w / 2 - 25, 10);
    } else if (room.type === 'server_room') {
      // Bottom wall with entrance opening for PostgreSQL data room
      ctx.fillRect(x, y + h - 10, 60, 10);
      ctx.strokeRect(x, y + h - 10, 60, 10);
      ctx.fillRect(x + 115, y + h - 10, w - 115, 10);
      ctx.strokeRect(x + 115, y + h - 10, w - 115, 10);
      // High-tech Data Room Doorway Threshold
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 60, y + h - 4, 55, 4);
    } else {
      ctx.fillRect(x, y + h - 10, w, 10);
      ctx.strokeRect(x, y + h - 10, w, 10);
    }

    // Room Label Plaque
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 16, y + 2, Math.min(w - 32, 160), 11);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(room.label, x + 20, y + 10);
  };

  // Helper to draw furniture per room
  const drawRoomDecor = (ctx: CanvasRenderingContext2D, room: OfficeRoom, tick: number) => {
    switch (room.type) {
      case 'director': {
        // Red Status / Warning Circle on Wall
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(room.x + 28, room.y + 36, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Whiteboard / Task Board on Left Wall
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(room.x + 18, room.y + 55, 34, 48);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(room.x + 18, room.y + 55, 34, 48);
        // Pinned sticky notes
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(room.x + 22, room.y + 60, 10, 10);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(room.x + 36, room.y + 60, 10, 10);
        ctx.fillStyle = '#fbcfe8';
        ctx.fillRect(room.x + 22, room.y + 75, 10, 10);

        // Executive Potted Plant in Corner
        drawPlant(ctx, room.x + room.width - 26, room.y + 36);

        // Executive Rug Under Desk
        ctx.fillStyle = 'rgba(79, 70, 229, 0.12)';
        ctx.fillRect(room.x + 55, room.y + 65, 105, 95);
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(room.x + 55, room.y + 65, 105, 95);

        // Visitor Stool / Briefing Stand Target Marker
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(105, 145, 16, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        ctx.fill();
        break;
      }

      case 'conference': {
        // Windows on top wall with blue sky reflection
        for (let i = 0; i < 4; i++) {
          const winX = room.x + 35 + i * 85;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(winX, room.y + 16, 50, 14);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1;
          ctx.strokeRect(winX, room.y + 16, 50, 14);
          // Window cross
          ctx.beginPath();
          ctx.moveTo(winX + 25, room.y + 16);
          ctx.lineTo(winX + 25, room.y + 30);
          ctx.stroke();
        }

        // Conference Table (Wooden Rectangular)
        const tableX = room.x + 60;
        const tableY = room.y + 70;
        const tableW = 255;
        const tableH = 65;

        // Table Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(tableX + 4, tableY + 4, tableW, tableH);

        // Table Surface
        ctx.fillStyle = '#92400e';
        ctx.fillRect(tableX, tableY, tableW, tableH);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(tableX + 3, tableY + 3, tableW - 6, tableH - 6);

        // Maroon Chairs Around Table
        const chairCount = 5;
        for (let i = 0; i < chairCount; i++) {
          const cx = tableX + 25 + i * 48;
          // Top chairs
          ctx.fillStyle = '#881337'; // Maroon
          ctx.fillRect(cx - 8, tableY - 12, 16, 10);
          ctx.fillStyle = '#9f1239';
          ctx.fillRect(cx - 6, tableY - 10, 12, 6);

          // Bottom chairs
          ctx.fillStyle = '#881337';
          ctx.fillRect(cx - 8, tableY + tableH + 2, 16, 10);
          ctx.fillStyle = '#9f1239';
          ctx.fillRect(cx - 6, tableY + tableH + 4, 12, 6);
        }

        // Small Potted Plant on Table
        drawPlant(ctx, tableX + tableW / 2, tableY + tableH / 2 - 2, 5);

        // Water Pitcher & Glasses on Table
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(tableX + 40, tableY + 24, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tableX + 54, tableY + 28, 5, 8);
        break;
      }

      case 'server_room': {
        // High-Tech PostgreSQL Server Racks & Database Clusters
        const psqlX = room.x + 24;
        const psqlY = room.y + 24;
        
        // 1. Primary PostgreSQL Main Server Rack
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(psqlX, psqlY, 130, 52);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(psqlX, psqlY, 130, 52);

        // Rack Header Banner
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(psqlX + 2, psqlY + 2, 126, 12);
        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 7px monospace';
        ctx.fillText("POSTGRESQL DB (PORT 5432)", psqlX + 6, psqlY + 10);

        // Server Blades & Blinking Query LEDs
        for (let blade = 0; blade < 4; blade++) {
          const by = psqlY + 16 + blade * 8.5;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(psqlX + 4, by, 122, 6.5);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(psqlX + 4, by, 122, 6.5);

          // LED Array
          for (let led = 0; led < 7; led++) {
            const isPulse = (tick + led * 7 + blade * 13) % 36 < 18;
            ctx.fillStyle = isPulse ? (led === 0 ? '#38bdf8' : '#10b981') : '#064e3b';
            ctx.fillRect(psqlX + 8 + led * 16, by + 1.5, 4, 3.5);
          }
        }

        // 2. Secondary Replica Server & Audit Vault Rack (Right)
        const secX = room.x + 168;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(secX, psqlY, 115, 52);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(secX, psqlY, 115, 52);

        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(secX + 2, psqlY + 2, 111, 12);
        ctx.fillStyle = '#7dd3fc';
        ctx.font = 'bold 7px monospace';
        ctx.fillText("AUDIT LOGS & LEDGER VAULT", secX + 6, psqlY + 10);

        for (let blade = 0; blade < 4; blade++) {
          const by = psqlY + 16 + blade * 8.5;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(secX + 4, by, 107, 6.5);
          for (let led = 0; led < 6; led++) {
            const isPulse = (tick + led * 9 + blade * 17) % 40 < 20;
            ctx.fillStyle = isPulse ? '#0284c7' : '#082f49';
            ctx.fillRect(secX + 8 + led * 16, by + 1.5, 4, 3.5);
          }
        }

        // 3. Dedicated Interactive Database Terminal Workstation Console
        const termX = room.x + 45;
        const termY = room.y + 84;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(termX, termY, 85, 26);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(termX, termY, 85, 26);

        // Terminal Screen (Phosphor Green display)
        ctx.fillStyle = '#022c22';
        ctx.fillRect(termX + 18, termY - 14, 48, 16);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1;
        ctx.strokeRect(termX + 18, termY - 14, 48, 16);

        ctx.fillStyle = '#34d399';
        ctx.font = '5px monospace';
        ctx.fillText("SQL: SELECT * FROM", termX + 20, termY - 8);
        ctx.fillText("accounts WHERE id...", termX + 20, termY - 2);

        // Stand / Query Point Target Marker on Floor
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(710, 120, 18, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 6px monospace';
        ctx.fillText("DB TERMINAL", 690, 123);
        break;
      }

      case 'breakroom': {
        // Coffee Counter Bar
        const barX = room.x + 25;
        const barY = room.y + 30;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(barX, barY, 140, 36);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(barX + 2, barY + 2, 136, 32);

        // Espresso Machine
        ctx.fillStyle = '#334155';
        ctx.fillRect(barX + 10, barY + 6, 28, 22);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(barX + 14, barY + 9, 20, 14);

        // Steam Animation
        if (tick % 50 < 25) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.moveTo(barX + 24, barY + 4);
          ctx.quadraticCurveTo(barX + 20, barY - 4, barX + 26, barY - 9);
          ctx.stroke();
        }

        // Water Dispenser Cooler
        ctx.fillStyle = '#10b981'; // Green cooler base
        ctx.fillRect(barX + 60, barY + 14, 18, 16);
        ctx.fillStyle = '#38bdf8'; // Water jug
        ctx.beginPath();
        ctx.arc(barX + 69, barY + 10, 9, 0, Math.PI * 2);
        ctx.fill();

        // Microwave / Mini Fridge
        ctx.fillStyle = '#64748b';
        ctx.fillRect(barX + 95, barY + 6, 32, 24);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX + 98, barY + 10, 18, 14);

        // Lounge Sofa
        ctx.fillStyle = '#db2777';
        ctx.fillRect(room.x + 30, room.y + 175, 140, 48);
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(room.x + 34, room.y + 179, 132, 34);

        // Potted Palm
        drawPlant(ctx, room.x + room.width - 30, room.y + 240, 9);
        break;
      }

      default:
        break;
    }
  };

  const drawPlant = (ctx: CanvasRenderingContext2D, x: number, y: number, size = 7) => {
    // Terracotta pot
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size * 0.75, y + size * 1.5);
    ctx.lineTo(x - size * 0.75, y + size * 1.5);
    ctx.closePath();
    ctx.fill();
    // Lush green leaves
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.5, size * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.8, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  };

  // Helper to draw realistic wooden computer desks with monitors and chairs
  const drawDesk = (ctx: CanvasRenderingContext2D, desk: OfficeDesk, tick: number) => {
    const x = desk.x;
    const y = desk.y;
    const deskW = 56;
    const deskH = 34;

    // Desk Wood Surface
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - deskW / 2, y - deskH / 2, deskW, deskH);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x - deskW / 2 + 2, y - deskH / 2 + 2, deskW - 4, deskH - 4);

    // Primary Computer Monitor (Facing User / South)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 14, y - deskH / 2 + 3, 22, 15);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 12, y - deskH / 2 + 5, 18, 11);

    // Animated code lines on monitor screen
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 10, y - deskH / 2 + 7, 10, 1.5);
    ctx.fillRect(x - 10, y - deskH / 2 + 10, 14, 1.5);
    ctx.fillRect(x - 10, y - deskH / 2 + 13, 7, 1.5);

    // Secondary Terminal Monitor or Documents
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 11, y - deskH / 2 + 4, 14, 14);
    ctx.fillStyle = '#064e3b'; // Terminal Green Screen
    ctx.fillRect(x + 13, y - deskH / 2 + 6, 10, 10);
    // Blinking cursor
    if (tick % 30 < 15) {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(x + 15, y - deskH / 2 + 8, 3, 3);
    }

    // Keyboard & Mouse
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 10, y + 4, 18, 7);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 11, y + 5, 4, 5);

    // Coffee Mug on desk
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x - 20, y + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Swivel Office Chair (Grey / Navy)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 9, y + 17, 18, 12);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 7, y + 19, 14, 8);
  };

  // Helper to draw glowing animated dashed trail showing real-time agent path
  const drawMovementTrail = (ctx: CanvasRenderingContext2D, agent: Agent, tick: number) => {
    ctx.strokeStyle = agent.color || '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -tick * 0.8;

    ctx.beginPath();
    ctx.moveTo(agent.x, agent.y + 14);

    // If agent has structured waypoints, draw along waypoints
    if (agent.waypoints && agent.waypoints.length > 0) {
      const startIndex = agent.currentWaypointIndex || 0;
      for (let i = startIndex; i < agent.waypoints.length; i++) {
        ctx.lineTo(agent.waypoints[i].x, agent.waypoints[i].y + 14);
      }
    } else {
      // Draw elbow waypoint path through office aisles
      const midY = (agent.y + agent.targetY) / 2;
      ctx.lineTo(agent.x, midY);
      ctx.lineTo(agent.targetX, midY);
      ctx.lineTo(agent.targetX, agent.targetY + 14);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing Target Landing Ring
    ctx.strokeStyle = agent.color || '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(agent.targetX, agent.targetY + 14, 12, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Small pulsing dot at target
    const pulseSize = 2 + Math.sin(tick * 0.15) * 1.5;
    ctx.fillStyle = agent.color || '#38bdf8';
    ctx.beginPath();
    ctx.arc(agent.targetX, agent.targetY + 14, pulseSize, 0, Math.PI * 2);
    ctx.fill();
  };

  // Helper to draw pixel-art character agent
  const drawAgent = (ctx: CanvasRenderingContext2D, agent: Agent, isSelected: boolean, tick: number) => {
    const x = agent.x;
    const y = agent.y;

    const isWalking = agent.state === 'walking' || 
                      agent.state === 'walking_to_boss' || 
                      agent.state === 'walking_to_desk' || 
                      agent.state === 'walking_to_postgres' || 
                      agent.state === 'walking_to_submit';

    const bob = isWalking ? Math.sin(tick * 0.35) * 3 : Math.sin(tick * 0.08) * 1;
    const legSwing = isWalking ? Math.sin(tick * 0.45) * 5 : 0;

    // Selection Aura or Shadow
    if (isSelected) {
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.ellipse(x, y + 16, 22, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y + 16, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (agent.state === 'querying_db') {
      // Emerald Data Pulse Halo when querying PostgreSQL database
      const dbPulse = 16 + Math.sin(tick * 0.2) * 5;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y + 14, dbPulse, dbPulse * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.beginPath();
      ctx.ellipse(x, y + 14, dbPulse, dbPulse * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floating data query bits
      for (let bit = 0; bit < 3; bit++) {
        const bitY = y - 10 - ((tick * 1.2 + bit * 12) % 28);
        const bitX = x - 12 + bit * 12;
        ctx.fillStyle = '#34d399';
        ctx.fillRect(bitX, bitY, 2.5, 2.5);
      }
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(x, y + 14, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs & Pants
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x - 6 + legSwing, y + 6 + bob, 5, 8);
    ctx.fillRect(x + 1 - legSwing, y + 6 + bob, 5, 8);

    // Shoes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 7 + legSwing, y + 12 + bob, 6, 4);
    ctx.fillRect(x + 1 - legSwing, y + 12 + bob, 6, 4);

    // Torso / Shirt
    ctx.fillStyle = agent.shirtColor || '#3b82f6';
    ctx.fillRect(x - 9, y - 6 + bob, 18, 13);

    // Tie / Badge
    if (agent.isSupervisor) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 3, y - 6 + bob, 6, 4);
      ctx.fillStyle = '#ef4444'; // Red executive tie
      ctx.fillRect(x - 1.5, y - 2 + bob, 3, 7);
    } else {
      ctx.fillStyle = '#fbbf24'; // Yellow employee badge
      ctx.fillRect(x - 2, y - 3 + bob, 4, 5);
    }

    // Arms & Hands
    ctx.fillStyle = agent.shirtColor || '#3b82f6';
    if (agent.state === 'coding' || agent.state === 'querying_db') {
      // Animated typing arms
      const typeBob = Math.sin(tick * 0.6) * 2;
      ctx.fillRect(x - 12, y - 3 + bob + typeBob, 4, 8);
      ctx.fillRect(x + 8, y - 3 + bob - typeBob, 4, 8);
      ctx.fillStyle = agent.skinColor;
      ctx.fillRect(x - 12, y + 4 + bob + typeBob, 4, 3);
      ctx.fillRect(x + 8, y + 4 + bob - typeBob, 4, 3);
    } else if (agent.state === 'submitting' || agent.state === 'walking_to_submit') {
      // Carrying document folder artifact
      ctx.fillRect(x - 12, y - 4 + bob, 4, 9);
      ctx.fillRect(x + 8, y - 4 + bob, 4, 9);
      // Yellow document folder
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 6, y - 1 + bob, 12, 10);
      ctx.strokeStyle = '#b45309';
      ctx.strokeRect(x - 6, y - 1 + bob, 12, 10);
    } else {
      ctx.fillRect(x - 12, y - 5 + bob, 4, 10);
      ctx.fillRect(x + 8, y - 5 + bob, 4, 10);
      ctx.fillStyle = agent.skinColor;
      ctx.fillRect(x - 12, y + 3 + bob, 4, 4);
      ctx.fillRect(x + 8, y + 3 + bob, 4, 4);
    }

    // Head / Face
    ctx.fillStyle = agent.skinColor;
    ctx.fillRect(x - 7, y - 18 + bob, 14, 13);

    // Hair
    ctx.fillStyle = agent.hairColor || '#1e293b';
    ctx.fillRect(x - 8, y - 22 + bob, 16, 6);
    ctx.fillRect(x - 8, y - 18 + bob, 3, 7);
    ctx.fillRect(x + 5, y - 18 + bob, 3, 7);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 4, y - 13 + bob, 2, 3);
    ctx.fillRect(x + 2, y - 13 + bob, 2, 3);

    // Agent Name Tag with Status Color
    let stateColor = '#22c55e'; // Green idle
    let stateText = 'IDLE';

    if (agent.state === 'walking_to_boss') {
      stateColor = '#f59e0b';
      stateText = 'TO BOSS CABIN';
    } else if (agent.state === 'in_boss_cabin') {
      stateColor = '#6366f1';
      stateText = 'BRIEFING';
    } else if (agent.state === 'walking_to_desk') {
      stateColor = '#0ea5e9';
      stateText = 'TO DESK';
    } else if (agent.state === 'walking_to_postgres') {
      stateColor = '#06b6d4';
      stateText = 'TO POSTGRESQL';
    } else if (agent.state === 'querying_db') {
      stateColor = '#10b981';
      stateText = 'QUERYING SQL (5432)';
    } else if (agent.state === 'coding') {
      stateColor = '#38bdf8';
      stateText = 'CODING';
    } else if (agent.state === 'walking_to_submit') {
      stateColor = '#ec4899';
      stateText = 'SUBMITTING';
    } else if (agent.state === 'submitting') {
      stateColor = '#10b981';
      stateText = 'SUBMITTED';
    } else if (agent.state === 'walking') {
      stateColor = '#a855f7';
      stateText = 'WALKING';
    }

    // Floating Name Tag Box
    const displayName = `${agent.name} [${agent.codeId || '0x'}]`;
    ctx.font = 'bold 8px monospace';
    const nameWidth = ctx.measureText(displayName).width;
    const tagW = Math.max(56, nameWidth + 14);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(x - tagW / 2, y - 34 + bob, tagW, 11);
    ctx.fillStyle = stateColor;
    ctx.fillRect(x - tagW / 2, y - 34 + bob, 3, 11);

    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.fillText(displayName, x + 2, y - 26 + bob);
    ctx.textAlign = 'left';

    // Speech Bubble
    if (agent.speechBubble && agent.speechBubble.expiresAt > Date.now()) {
      const bubbleText = agent.speechBubble.text;
      ctx.font = 'bold 9px sans-serif';
      const textMetrics = ctx.measureText(bubbleText);
      const bubbleW = Math.min(210, Math.max(90, textMetrics.width + 16));
      const bubbleH = 22;
      const bubbleX = x - bubbleW / 2;
      const bubbleY = y - 62 + bob;

      // Bubble background
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
      ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);

      // Tail
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 4, bubbleY + bubbleH);
      ctx.lineTo(x + 4, bubbleY + bubbleH);
      ctx.lineTo(x, bubbleY + bubbleH + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Text with clipping
      ctx.fillStyle = '#0f172a';
      const truncatedText = bubbleText.length > 32 ? bubbleText.slice(0, 30) + '...' : bubbleText;
      ctx.fillText(truncatedText, bubbleX + 8, bubbleY + 14);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#18231c] border-2 border-[#2c3d31] rounded-lg overflow-hidden shadow-2xl">
      {/* Canvas Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#213025] border-b border-[#2e4334] text-xs text-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            2D Retro Office Live Stream
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-300/80 font-mono text-[10px] hidden sm:inline">
            Boss Cabin [0x1] ↔ Bullpen Live Tracking
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#152019] rounded px-1.5 py-0.5 border border-[#2e4334]">
            <button
              onClick={() => setZoom(Math.max(0.8, zoom - 0.1))}
              className="p-1 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] px-1 text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1.4, zoom + 0.1))}
              className="p-1 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] px-2 py-0.5 rounded">
            {agents.length} Agents Connected
          </span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-[#1a251e] flex items-center justify-center p-2 overflow-auto"
      >
        <canvas
          ref={canvasRef}
          width={960}
          height={520}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          className="rounded shadow-2xl border-2 border-[#2b3e30] cursor-crosshair transition-transform origin-center"
          style={{ transform: `scale(${zoom})`, maxWidth: '100%', height: 'auto' }}
        />

        {/* Hover Agent Badge */}
        {hoveredAgent && (
          <div 
            className="absolute bottom-3 left-3 bg-[#0f1712]/95 backdrop-blur-md border border-emerald-800/80 text-slate-100 px-3 py-2 rounded shadow-xl pointer-events-none text-xs flex items-center gap-3 animate-fade-in"
          >
            <div 
              className="w-3.5 h-3.5 rounded-full" 
              style={{ backgroundColor: hoveredAgent.color }}
            />
            <div>
              <div className="font-bold font-mono text-emerald-300">
                {hoveredAgent.name} [{hoveredAgent.codeId}]
              </div>
              <div className="text-[10px] text-slate-300">{hoveredAgent.title}</div>
            </div>
            <div className="border-l border-emerald-900 pl-3 font-mono text-[10px] text-sky-300">
              State: <span className="uppercase text-emerald-400 font-bold">{hoveredAgent.state.replace(/_/g, ' ')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Room Legend */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#17221b] border-t border-[#26372b] text-[10px] text-slate-300 font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Boss Cabin [0x1]
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Boardroom
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-sm" /> Bullpen Desks
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Server Lab
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-pink-500 rounded-sm" /> Cafe & Lounge
          </span>
        </div>
        <div className="text-[10px] text-emerald-400/80 font-mono hidden md:inline">
          Real-time Waypoint Interpolation Active
        </div>
      </div>
    </div>
  );
};
