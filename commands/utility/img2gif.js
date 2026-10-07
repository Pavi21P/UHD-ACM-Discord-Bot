const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const sharp = require('sharp');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('img2gif')
    .setDescription('Convert an uploaded image into a GIF')
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription('Image to convert')
        .setRequired(true)),

  async execute(interaction) {
    const attachment = interaction.options.getAttachment('image');
    const allowedExtensions = /\.(png|jpe?g|webp|bmp|tiff?)$/i;
    const hasImageMime = attachment?.contentType?.startsWith('image/');
    const isGifMime = attachment?.contentType === 'image/gif';
    const isGifExtension = /\.gif$/i.test(attachment?.name || '');
    const hasAllowedExtension = allowedExtensions.test(attachment?.name || '');

    if (isGifMime || isGifExtension) {
      await interaction.reply({
        content: 'GIF files are not allowed. Upload a static image instead.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!hasImageMime && !hasAllowedExtension) {
      await interaction.reply({
        content: 'Please upload an image file (png, jpg, jpeg, webp, bmp, tif, tiff).',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.deferReply();

    try {
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const inputBuffer = Buffer.from(await response.arrayBuffer());
      const metadata = await sharp(inputBuffer).metadata();
      if (!metadata.format) {
        await interaction.editReply('That file is not a valid image.');
        return;
      }
      if (metadata.format.toLowerCase() === 'gif') {
        await interaction.editReply('GIF files are not allowed. Upload a static image instead.');
        return;
      }

      // Resize very large images to keep the output under Discord upload limits.
      const maxSize = 480;
      const shouldResize = (metadata.width || 0) > maxSize || (metadata.height || 0) > maxSize;

      let pipeline = sharp(inputBuffer, { animated: true });
      if (shouldResize) {
        pipeline = pipeline.resize({
          width: maxSize,
          height: maxSize,
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      const gifBuffer = await pipeline
        .gif({ effort: 5 })
        .toBuffer();

      const output = new AttachmentBuilder(gifBuffer, { name: 'converted.gif' });

      await interaction.editReply({
        content: 'Converted to GIF:',
        files: [output]
      });
    } catch (error) {
      console.error('img2gif conversion failed:', error);
      await interaction.editReply('Could not convert that image to GIF.');
    }
  }
};
