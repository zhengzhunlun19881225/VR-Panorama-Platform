import { VRProject } from '../types';
import { generateProceduralEquirectangular, simulateTileGeneration } from '../utils/panoramaHelper';

// Pre-generate procedural equirectangular panorama data URLs for ultra-reliable instant preview
const techLobbyEquirect = generateProceduralEquirectangular('tech', '1F 创新总部 · 穹顶科技大堂');
const techExhibitEquirect = generateProceduralEquirectangular('cyber', '2F 沉浸式未来数字展厅');
const techBoardroomEquirect = generateProceduralEquirectangular('luxury', '3F VIP 云端全景行政会议室');
const techRooftopEquirect = generateProceduralEquirectangular('nature', '4F 顶层星空天台花园');

const villaLivingEquirect = generateProceduralEquirectangular('luxury', '山海天境 · 挑空全景海景客厅');
const villaPoolEquirect = generateProceduralEquirectangular('nature', '山海天境 · 恒温无边际观海泳池');
const villaKitchenEquirect = generateProceduralEquirectangular('tech', '山海天境 · 开放式智能中西双厨');

const museumHallEquirect = generateProceduralEquirectangular('museum', '故宫数字化展 · 正殿太和中轴');
const museumGardenEquirect = generateProceduralEquirectangular('nature', '故宫数字化展 · 御花园古韵芳华');

export const INITIAL_PROJECTS: VRProject[] = [
  {
    id: 'proj-tech-hq',
    name: '未来科技创新总部大厦 360° VR 全景漫游',
    description: '国家级数字化智慧园区样板工程，涵盖中央穹顶大堂、互动科技展厅、云端行政会议室与星空天台。',
    coverImage: techLobbyEquirect,
    keywords: ['科技展厅', '智慧总部', '元宇宙', '建筑全景', '智慧园区'],
    copyright: '© 2026 未来科技数字空间矩阵 版权所有',
    status: 'published',
    accessPermission: 'public',
    createdAt: '2026-08-15 10:30',
    updatedAt: '2026-09-12 16:45',
    visits: 28420,
    isArchived: false,
    currentSceneId: 'scene-tech-1f',
    currentFloorId: 'floor-tech-1f',
    associatedFloors: [
      { id: 'af-1', projectId: 'proj-tech-hq', projectName: '总部A座主楼', floorName: '1F 科技大堂', level: 1 },
      { id: 'af-2', projectId: 'proj-tech-hq', projectName: '总部A座主楼', floorName: '2F 数字展厅', level: 2 },
      { id: 'af-3', projectId: 'proj-tech-hq', projectName: '总部A座主楼', floorName: '3F 行政会议', level: 3 },
      { id: 'af-4', projectId: 'proj-tech-hq', projectName: '总部A座主楼', floorName: '4F 星空天台', level: 4 },
      { id: 'af-5', projectId: 'proj-tech-b', projectName: 'B座人工智能研究院 (关联项目)', floorName: 'B1 算力中心', level: -1 }
    ],
    floorMaps: [
      {
        id: 'floor-tech-1f',
        name: '1F 穹顶迎宾大堂',
        level: 1,
        mapUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=800&q=80',
        points: [{ sceneId: 'scene-tech-1f', x: 48, y: 52 }]
      },
      {
        id: 'floor-tech-2f',
        name: '2F 数字多媒体展厅',
        level: 2,
        mapUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
        points: [{ sceneId: 'scene-tech-2f', x: 62, y: 44 }]
      },
      {
        id: 'floor-tech-3f',
        name: '3F VIP云端行政会议',
        level: 3,
        mapUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        points: [{ sceneId: 'scene-tech-3f', x: 35, y: 58 }]
      },
      {
        id: 'floor-tech-4f',
        name: '4F 顶层星空天台',
        level: 4,
        mapUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        points: [{ sceneId: 'scene-tech-4f', x: 50, y: 50 }]
      }
    ],
    roamTour: {
      enabled: true,
      autoStart: false,
      loop: true,
      waypoints: [
        {
          id: 'wp-1',
          sceneId: 'scene-tech-1f',
          title: '一楼迎宾入口俯瞰',
          yaw: 0,
          pitch: -10,
          fov: 75,
          view: { yaw: 0, pitch: -10, fov: 75 },
          transitDuration: 0.8,
          stayDuration: 1.2,
          caption: '欢迎来到未来科技总部大厦！中庭挑高28米，采光顶由680块光伏玻璃构成。'
        },
        {
          id: 'wp-2',
          sceneId: 'scene-tech-2f',
          title: '二楼数字全息展区',
          yaw: 45,
          pitch: 5,
          fov: 70,
          view: { yaw: 45, pitch: 5, fov: 70 },
          transitDuration: 0.8,
          stayDuration: 1.2,
          caption: '2F数字展厅：配备环幕交互装置与AI空间计算中心。'
        },
        {
          id: 'wp-3',
          sceneId: 'scene-tech-3f',
          title: '三楼VIP云端会议室',
          yaw: -60,
          pitch: 0,
          fov: 65,
          view: { yaw: -60, pitch: 0, fov: 65 },
          transitDuration: 0.8,
          stayDuration: 1.2,
          caption: '3F云端全景会议室，具备270°高空天际线景观与全套智能协作硬件。'
        },
        {
          id: 'wp-4',
          sceneId: 'scene-tech-4f',
          title: '顶层天台花园全景',
          yaw: 120,
          pitch: 15,
          fov: 80,
          view: { yaw: 120, pitch: 15, fov: 80 },
          transitDuration: 0.8,
          stayDuration: 1.2,
          caption: '4F天台空中花园，园区绿化覆盖率超45%，是员工放松与商务沙龙的理想之选。'
        }
      ]
    },
    scenes: [
      {
        id: 'scene-tech-1f',
        name: '1F 穹顶科技大堂',
        sortOrder: 1,
        panoramaUrl: techLobbyEquirect,
        panoramaThumb: techLobbyEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 0, pitch: -5, fov: 75 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -75, pitchMax: 85, fovMin: 40, fovMax: 100 },
        autoRotate: true,
        autoRotateSpeed: 0.8,
        littlePlanet: true,
        littlePlanetDuration: 2.5,
        gyroscopeEnabled: true,
        floorId: 'floor-tech-1f',
        floorPoint: { x: 48, y: 52 },
        tileInfo: simulateTileGeneration(22.4),
        bgm: {
          enabled: true,
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
          name: '轻柔未来感科技环境音乐',
          loop: true,
          volume: 40
        },
        narration: {
          enabled: true,
          url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=welcome-gentle-narration.mp3',
          name: '1F 大堂官方语音讲解',
          autoPlay: false,
          loop: false,
          volume: 80
        },
        hotspots: [
          {
            id: 'hs-jump-2f',
            title: '前往 2F 沉浸式数字展厅',
            type: 'scene_jump',
            position: { yaw: 35, pitch: -2 },
            style: { icon: 'arrow', size: 'md', color: '#0ea5e9', hoverEffect: 'pulse', customScale: 1.1 },
            targetSceneId: 'scene-tech-2f',
            targetLandingView: { yaw: 0, pitch: 0 }
          },
          {
            id: 'hs-jump-3f',
            title: '直达电梯至 3F VIP会议室',
            type: 'scene_jump',
            position: { yaw: -70, pitch: -6 },
            style: { icon: 'arrow', size: 'md', color: '#38bdf8', hoverEffect: 'bounce', customScale: 1 },
            targetSceneId: 'scene-tech-3f',
            targetLandingView: { yaw: -30, pitch: 0 }
          },
          {
            id: 'hs-info-arch',
            title: '中庭穹顶建筑与采光设计',
            type: 'info_richtext',
            position: { yaw: -15, pitch: 35 },
            style: { icon: 'info', size: 'md', color: '#6366f1', hoverEffect: 'tooltip' },
            content: {
              title: '中庭仿生穹顶与自适应遮阳系统',
              description: '结构荣获 LEED 白金级与中国绿色建筑三星认证。',
              richText: '中央穹顶跨度 42 米，内部布置了环境光敏传感器，能根据日照角度实时自动调节透光率，使室内常年保持最舒适的自然照明，年节能超 38%。'
            }
          },
          {
            id: 'hs-gallery-award',
            title: '园区荣誉与专利成果墙',
            type: 'info_image',
            position: { yaw: -110, pitch: 2 },
            style: { icon: 'image', size: 'md', color: '#10b981', hoverEffect: 'card' },
            content: {
              title: '国家高新科技园区荣誉展示',
              description: '点击查看园区获得的多项国家级发明专利与设计大奖。',
              images: [
                'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
              ]
            }
          },
          {
            id: 'hs-video-intro',
            title: '园区8K官方宣传纪录片',
            type: 'info_video',
            position: { yaw: 85, pitch: 8 },
            style: { icon: 'video', size: 'lg', color: '#f43f5e', hoverEffect: 'pulse' },
            content: {
              title: '未来科技总部大厦 · 空间之光',
              description: '时长 2分45秒 | 4K HDR超高清画质实景航拍纪录片',
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            }
          },
          {
            id: 'hs-booking-form',
            title: '贵宾参访与商务预约',
            type: 'info_form',
            position: { yaw: -155, pitch: -12 },
            style: { icon: 'sparkle', size: 'md', color: '#f59e0b', hoverEffect: 'pulse' },
            content: {
              title: '数字展厅实地参访预约登记',
              description: '填写下方信息，园区接待专属顾问将在 2 小时内与您联络确认。',
              formFields: [
                { id: 'f1', label: '预约参访单位/姓名', type: 'text', placeholder: '请输入企业名称或联系人姓名', required: true },
                { id: 'f2', label: '联系电话', type: 'tel', placeholder: '请输入手机号码', required: true },
                { id: 'f3', label: '期望参观日期', type: 'date', required: true },
                { id: 'f4', label: '参访人数及接待需求', type: 'textarea', placeholder: '例如：约15人商务团，需中英双语接待', required: false }
              ]
            }
          },
          {
            id: 'hs-contact-phone',
            title: '一键拨打接待前台',
            type: 'info_phone',
            position: { yaw: -38, pitch: -16 },
            style: { icon: 'phone', size: 'sm', color: '#059669', hoverEffect: 'tooltip' },
            content: {
              title: '迎宾前台直拨专线',
              description: '工作日 08:30 - 18:00 提供专人在线答疑与引导',
              phone: '400-880-9966'
            }
          }
        ]
      },
      {
        id: 'scene-tech-2f',
        name: '2F 沉浸式数字展厅',
        sortOrder: 2,
        panoramaUrl: techExhibitEquirect,
        panoramaThumb: techExhibitEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 20, pitch: 0, fov: 70 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -70, pitchMax: 70, fovMin: 40, fovMax: 100 },
        autoRotate: true,
        autoRotateSpeed: 0.5,
        littlePlanet: false,
        littlePlanetDuration: 2.0,
        gyroscopeEnabled: true,
        floorId: 'floor-tech-2f',
        floorPoint: { x: 62, y: 44 },
        tileInfo: simulateTileGeneration(25.8),
        bgm: {
          enabled: true,
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
          name: '展厅科技脉动背景音',
          loop: true,
          volume: 35
        },
        narration: {
          enabled: false,
          url: '',
          name: '',
          autoPlay: false,
          loop: false,
          volume: 80
        },
        hotspots: [
          {
            id: 'hs-2f-back-1f',
            title: '返回 1F 穹顶大堂',
            type: 'scene_jump',
            position: { yaw: -160, pitch: -8 },
            style: { icon: 'arrow', size: 'md', color: '#0ea5e9', hoverEffect: 'bounce' },
            targetSceneId: 'scene-tech-1f',
            targetLandingView: { yaw: 0, pitch: 0 }
          },
          {
            id: 'hs-2f-jump-3f',
            title: '上升至 3F VIP会议室',
            type: 'scene_jump',
            position: { yaw: 110, pitch: 4 },
            style: { icon: 'arrow', size: 'md', color: '#6366f1', hoverEffect: 'pulse' },
            targetSceneId: 'scene-tech-3f',
            targetLandingView: { yaw: 0, pitch: 0 }
          },
          {
            id: 'hs-2f-link-meta',
            title: '访问元宇宙数字孪生体验站',
            type: 'info_link',
            position: { yaw: 0, pitch: 12 },
            style: { icon: 'link', size: 'md', color: '#ec4899', hoverEffect: 'tooltip' },
            content: {
              title: '园区数字孪生管控平台',
              description: '实时查看园区能耗、人流密度与物联网设备运转态势。',
              linkUrl: 'https://ai.google.dev',
              linkTitle: '打开数字化运营看板'
            }
          }
        ]
      },
      {
        id: 'scene-tech-3f',
        name: '3F VIP云端全景会议室',
        sortOrder: 3,
        panoramaUrl: techBoardroomEquirect,
        panoramaThumb: techBoardroomEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: -45, pitch: 0, fov: 65 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -60, pitchMax: 60, fovMin: 40, fovMax: 95 },
        autoRotate: false,
        autoRotateSpeed: 0.6,
        littlePlanet: false,
        littlePlanetDuration: 2.0,
        gyroscopeEnabled: true,
        floorId: 'floor-tech-3f',
        floorPoint: { x: 35, y: 58 },
        tileInfo: simulateTileGeneration(19.2),
        bgm: {
          enabled: false,
          url: '',
          name: '',
          loop: true,
          volume: 30
        },
        narration: {
          enabled: false,
          url: '',
          name: '',
          autoPlay: false,
          loop: false,
          volume: 80
        },
        hotspots: [
          {
            id: 'hs-3f-jump-4f',
            title: '前往 4F 顶层星空天台',
            type: 'scene_jump',
            position: { yaw: 65, pitch: 6 },
            style: { icon: 'arrow', size: 'md', color: '#10b981', hoverEffect: 'pulse' },
            targetSceneId: 'scene-tech-4f',
            targetLandingView: { yaw: 0, pitch: 10 }
          },
          {
            id: 'hs-3f-back-2f',
            title: '返回 2F 数字展厅',
            type: 'scene_jump',
            position: { yaw: -140, pitch: -10 },
            style: { icon: 'arrow', size: 'md', color: '#0ea5e9', hoverEffect: 'bounce' },
            targetSceneId: 'scene-tech-2f',
            targetLandingView: { yaw: 0, pitch: 0 }
          }
        ]
      },
      {
        id: 'scene-tech-4f',
        name: '4F 顶层星空天台花园',
        sortOrder: 4,
        panoramaUrl: techRooftopEquirect,
        panoramaThumb: techRooftopEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 90, pitch: 10, fov: 80 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -70, pitchMax: 80, fovMin: 40, fovMax: 105 },
        autoRotate: true,
        autoRotateSpeed: 0.6,
        littlePlanet: true,
        littlePlanetDuration: 3.0,
        gyroscopeEnabled: true,
        floorId: 'floor-tech-4f',
        floorPoint: { x: 50, y: 50 },
        tileInfo: simulateTileGeneration(21.7),
        bgm: {
          enabled: true,
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
          name: '天台微风自然白噪音',
          loop: true,
          volume: 25
        },
        narration: {
          enabled: false,
          url: '',
          name: '',
          autoPlay: false,
          loop: false,
          volume: 80
        },
        hotspots: [
          {
            id: 'hs-4f-back-1f',
            title: '乘坐直梯返回 1F 大堂',
            type: 'scene_jump',
            position: { yaw: -120, pitch: -15 },
            style: { icon: 'arrow', size: 'md', color: '#0ea5e9', hoverEffect: 'pulse' },
            targetSceneId: 'scene-tech-1f',
            targetLandingView: { yaw: 0, pitch: 0 }
          }
        ]
      }
    ]
  },
  {
    id: 'proj-villa-sea',
    name: '山海天境 · 轻奢智慧海景独栋别墅',
    description: '坐拥270度南向一线海景，配备全屋智能家居联动、恒温私属无边际泳池与开放式名仕会客厅。',
    coverImage: villaLivingEquirect,
    keywords: ['豪宅', '独栋别墅', '全景看房', '智慧家居', '海景住宅'],
    copyright: '© 2026 山海天境地产品牌 数字化VR部',
    status: 'published',
    accessPermission: 'password',
    accessPassword: '888',
    createdAt: '2026-09-01 14:20',
    updatedAt: '2026-09-11 09:15',
    visits: 14590,
    isArchived: false,
    currentSceneId: 'scene-villa-living',
    currentFloorId: 'floor-villa-1f',
    associatedFloors: [
      { id: 'af-v1', projectId: 'proj-villa-sea', projectName: '山海天境 01号独栋', floorName: '1F 客厅与庭院', level: 1 },
      { id: 'af-v2', projectId: 'proj-villa-sea', projectName: '山海天境 01号独栋', floorName: '2F 景观主卧套房', level: 2 }
    ],
    floorMaps: [
      {
        id: 'floor-villa-1f',
        name: '1F 会客与泳池庭院',
        level: 1,
        mapUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        points: [
          { sceneId: 'scene-villa-living', x: 45, y: 55 },
          { sceneId: 'scene-villa-pool', x: 75, y: 70 },
          { sceneId: 'scene-villa-kitchen', x: 25, y: 40 }
        ]
      }
    ],
    roamTour: {
      enabled: true,
      autoStart: false,
      loop: true,
      waypoints: [
        {
          id: 'wp-v1',
          sceneId: 'scene-villa-living',
          title: '挑空会客厅入户视角',
          yaw: 0,
          pitch: 0,
          fov: 75,
          view: { yaw: 0, pitch: 0, fov: 75 },
          transitDuration: 0.8,
          stayDuration: 1.2,
          caption: '挑空客厅层高 7.2 米，全景无框玻璃幕墙直面浩瀚海景。'
        },
        {
          id: 'wp-v2',
          sceneId: 'scene-villa-pool',
          title: '无边际恒温泳池庭院',
          yaw: 60,
          pitch: -10,
          fov: 70,
          view: { yaw: 60, pitch: -10, fov: 70 },
          transitDuration: 0.8,
          stayDuration: 1.2,
          caption: '泳池长 25 米，与远方海平面连为一体，傍晚可观赏绝美海上落日。'
        },
        {
          id: 'wp-v3',
          sceneId: 'scene-villa-kitchen',
          title: '德式定制开放式中西厨',
          yaw: -45,
          pitch: -5,
          fov: 75,
          view: { yaw: -45, pitch: -5, fov: 75 },
          transitDuration: 0.8,
          stayDuration: 1.2,
          caption: '中岛台配备嘉格纳顶级嵌入式厨电，享受烹饪与社交的艺术融合。'
        }
      ]
    },
    scenes: [
      {
        id: 'scene-villa-living',
        name: '挑空全景海景客厅',
        sortOrder: 1,
        panoramaUrl: villaLivingEquirect,
        panoramaThumb: villaLivingEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 10, pitch: 0, fov: 75 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -70, pitchMax: 70, fovMin: 45, fovMax: 100 },
        autoRotate: true,
        autoRotateSpeed: 0.7,
        littlePlanet: true,
        littlePlanetDuration: 2.0,
        gyroscopeEnabled: true,
        floorId: 'floor-villa-1f',
        floorPoint: { x: 45, y: 55 },
        tileInfo: simulateTileGeneration(26.1),
        bgm: {
          enabled: true,
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
          name: '海风与钢琴伴奏',
          loop: true,
          volume: 30
        },
        narration: {
          enabled: false,
          url: '',
          name: '',
          autoPlay: false,
          loop: false,
          volume: 80
        },
        hotspots: [
          {
            id: 'hs-v-pool',
            title: '移步至 无边际泳池庭院',
            type: 'scene_jump',
            position: { yaw: 75, pitch: -5 },
            style: { icon: 'arrow', size: 'md', color: '#0284c7', hoverEffect: 'pulse' },
            targetSceneId: 'scene-villa-pool',
            targetLandingView: { yaw: 0, pitch: 0 }
          },
          {
            id: 'hs-v-kitchen',
            title: '前往 开放式中西双厨',
            type: 'scene_jump',
            position: { yaw: -90, pitch: -3 },
            style: { icon: 'arrow', size: 'md', color: '#d97706', hoverEffect: 'pulse' },
            targetSceneId: 'scene-villa-kitchen',
            targetLandingView: { yaw: 0, pitch: 0 }
          },
          {
            id: 'hs-v-phone',
            title: '咨询置业顾问专线',
            type: 'info_phone',
            position: { yaw: 10, pitch: -20 },
            style: { icon: 'phone', size: 'sm', color: '#16a34a', hoverEffect: 'tooltip' },
            content: {
              title: '贵宾一对一私享接待',
              phone: '188-0000-6688'
            }
          }
        ]
      },
      {
        id: 'scene-villa-pool',
        name: '恒温无边际观海泳池',
        sortOrder: 2,
        panoramaUrl: villaPoolEquirect,
        panoramaThumb: villaPoolEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 0, pitch: -5, fov: 75 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -75, pitchMax: 75, fovMin: 45, fovMax: 100 },
        autoRotate: true,
        autoRotateSpeed: 0.6,
        littlePlanet: false,
        littlePlanetDuration: 2.0,
        gyroscopeEnabled: true,
        floorId: 'floor-villa-1f',
        floorPoint: { x: 75, y: 70 },
        tileInfo: simulateTileGeneration(23.4),
        bgm: {
          enabled: true,
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
          name: '海浪轻吟',
          loop: true,
          volume: 25
        },
        narration: { enabled: false, url: '', name: '', autoPlay: false, loop: false, volume: 80 },
        hotspots: [
          {
            id: 'hs-pool-living',
            title: '返回 客厅主空间',
            type: 'scene_jump',
            position: { yaw: -140, pitch: 0 },
            style: { icon: 'arrow', size: 'md', color: '#0ea5e9', hoverEffect: 'bounce' },
            targetSceneId: 'scene-villa-living'
          }
        ]
      },
      {
        id: 'scene-villa-kitchen',
        name: '开放式智能中西双厨',
        sortOrder: 3,
        panoramaUrl: villaKitchenEquirect,
        panoramaThumb: villaKitchenEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 0, pitch: 0, fov: 70 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -70, pitchMax: 70, fovMin: 40, fovMax: 95 },
        autoRotate: false,
        autoRotateSpeed: 0.5,
        littlePlanet: false,
        littlePlanetDuration: 2.0,
        gyroscopeEnabled: true,
        floorId: 'floor-villa-1f',
        floorPoint: { x: 25, y: 40 },
        tileInfo: simulateTileGeneration(18.9),
        bgm: { enabled: false, url: '', name: '', loop: true, volume: 30 },
        narration: { enabled: false, url: '', name: '', autoPlay: false, loop: false, volume: 80 },
        hotspots: [
          {
            id: 'hs-kitchen-living',
            title: '返回 客厅',
            type: 'scene_jump',
            position: { yaw: 135, pitch: -2 },
            style: { icon: 'arrow', size: 'md', color: '#0ea5e9', hoverEffect: 'bounce' },
            targetSceneId: 'scene-villa-living'
          }
        ]
      }
    ]
  },
  {
    id: 'proj-museum-heritage',
    name: '故宫古建文博数字化沉浸展',
    description: '采用高精度空间计算建模与超清全景图像，重构太和殿与御花园古建筑群，实现足不出户云端赏御苑。',
    coverImage: museumHallEquirect,
    keywords: ['数字文博', '古建筑', '全景故宫', '历史文化', '非遗'],
    copyright: '© 2026 数字文博全景研学项目组',
    status: 'draft',
    accessPermission: 'internal',
    createdAt: '2026-09-08 16:10',
    updatedAt: '2026-09-12 11:20',
    visits: 3820,
    isArchived: false,
    currentSceneId: 'scene-museum-hall',
    currentFloorId: 'floor-museum-1f',
    associatedFloors: [
      { id: 'af-m1', projectId: 'proj-museum-heritage', projectName: '紫禁城中轴古建', floorName: '中轴太和主殿', level: 1 },
      { id: 'af-m2', projectId: 'proj-museum-heritage', projectName: '紫禁城中轴古建', floorName: '御花园北极阁', level: 2 }
    ],
    floorMaps: [
      {
        id: 'floor-museum-1f',
        name: '紫禁城太和中轴线',
        level: 1,
        mapUrl: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=800&q=80',
        points: [
          { sceneId: 'scene-museum-hall', x: 50, y: 65 },
          { sceneId: 'scene-museum-garden', x: 50, y: 25 }
        ]
      }
    ],
    roamTour: {
      enabled: true,
      autoStart: false,
      loop: false,
      waypoints: [
        {
          id: 'wp-m1',
          sceneId: 'scene-museum-hall',
          title: '太和殿正中金砖御座',
          yaw: 0,
          pitch: 0,
          fov: 70,
          view: { yaw: 0, pitch: 0, fov: 70 },
          transitDuration: 3,
          stayDuration: 5,
          caption: '太和殿内共有金砖四千七百一十八块，质地坚细，敲之有金石之声。'
        }
      ]
    },
    scenes: [
      {
        id: 'scene-museum-hall',
        name: '故宫数字化展 · 正殿太和中轴',
        sortOrder: 1,
        panoramaUrl: museumHallEquirect,
        panoramaThumb: museumHallEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 0, pitch: 0, fov: 75 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -65, pitchMax: 70, fovMin: 40, fovMax: 95 },
        autoRotate: true,
        autoRotateSpeed: 0.4,
        littlePlanet: true,
        littlePlanetDuration: 2.5,
        gyroscopeEnabled: true,
        floorId: 'floor-museum-1f',
        floorPoint: { x: 50, y: 65 },
        tileInfo: simulateTileGeneration(28.3),
        bgm: {
          enabled: true,
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
          name: '宫廷雅乐古琴雅奏',
          loop: true,
          volume: 35
        },
        narration: { enabled: false, url: '', name: '', autoPlay: false, loop: false, volume: 80 },
        hotspots: [
          {
            id: 'hs-m-garden',
            title: '步入 御花园古韵芳华',
            type: 'scene_jump',
            position: { yaw: 0, pitch: -3 },
            style: { icon: 'arrow', size: 'md', color: '#b45309', hoverEffect: 'pulse' },
            targetSceneId: 'scene-museum-garden'
          }
        ]
      },
      {
        id: 'scene-museum-garden',
        name: '故宫数字化展 · 御花园古韵芳华',
        sortOrder: 2,
        panoramaUrl: museumGardenEquirect,
        panoramaThumb: museumGardenEquirect,
        aspectRatio: '2:1',
        initialView: { yaw: 45, pitch: 0, fov: 75 },
        viewLimits: { yawMin: -180, yawMax: 180, pitchMin: -65, pitchMax: 75, fovMin: 40, fovMax: 100 },
        autoRotate: true,
        autoRotateSpeed: 0.5,
        littlePlanet: false,
        littlePlanetDuration: 2.0,
        gyroscopeEnabled: true,
        floorId: 'floor-museum-1f',
        floorPoint: { x: 50, y: 25 },
        tileInfo: simulateTileGeneration(22.0),
        bgm: { enabled: true, url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3', name: '园林幽泉竹韵', loop: true, volume: 30 },
        narration: { enabled: false, url: '', name: '', autoPlay: false, loop: false, volume: 80 },
        hotspots: [
          {
            id: 'hs-garden-hall',
            title: '回到 正殿太和中轴',
            type: 'scene_jump',
            position: { yaw: -180, pitch: -5 },
            style: { icon: 'arrow', size: 'md', color: '#b45309', hoverEffect: 'bounce' },
            targetSceneId: 'scene-museum-hall'
          }
        ]
      }
    ]
  }
];

export const initialProjects = INITIAL_PROJECTS;
