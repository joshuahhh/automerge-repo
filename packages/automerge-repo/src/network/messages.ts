import { StorageId } from "../storage/types.js"
import { DocumentId, PeerId, SessionId } from "../types.js"

export type Message = {
  type: string

  /** The peer ID of the sender of this message */
  senderId: PeerId

  /** The peer ID of the recipient of this message */
  targetId: PeerId

  data?: Uint8Array

  documentId?: DocumentId
}

/**
 * A sync message for a particular document
 */
export type SyncMessage = {
  type: "sync"
  senderId: PeerId
  targetId: PeerId

  /** The automerge sync message */
  data: Uint8Array

  /** The document ID of the document this message is for */
  documentId: DocumentId
}

/**
 * An ephemeral message.
 *
 * @remarks
 * Ephemeral messages are not persisted anywhere. The data property can be used by the application
 * as needed. The repo gossips these around.
 *
 * In order to avoid infinite loops of ephemeral messages, every message has (a) a session ID, which
 * is a random number generated by the sender at startup time; and (b) a sequence number. The
 * combination of these two things allows us to discard messages we have already seen.
 * */
export type EphemeralMessage = {
  type: "ephemeral"
  senderId: PeerId
  targetId: PeerId

  /** A sequence number which must be incremented for each message sent by this peer. */
  count: number

  /** The ID of the session this message is part of. The sequence number for a given session always increases. */
  sessionId: SessionId

  /** The document ID this message pertains to. */
  documentId: DocumentId

  /** The actual data of the message. */
  data: Uint8Array
}

/**
 * Sent by a {@link Repo} to indicate that it does not have the document and none of its connected
 * peers do either.
 */
export type DocumentUnavailableMessage = {
  type: "doc-unavailable"
  senderId: PeerId
  targetId: PeerId

  /** The document which the peer claims it doesn't have */
  documentId: DocumentId
}

/**
 * Sent by a {@link Repo} to request a document from a peer.
 *
 * @remarks
 * This is identical to a {@link SyncMessage} except that it is sent by a {@link Repo}
 * as the initial sync message when asking the other peer if it has the document.
 * */
export type RequestMessage = {
  type: "request"
  senderId: PeerId
  targetId: PeerId

  /** The automerge sync message */
  data: Uint8Array

  /** The document ID of the document this message is for */
  documentId: DocumentId
}

/**
 * Sent by a {@link Repo} to add or remove storage IDs from a remote peer's subscription.
 */
export type RemoteSubscriptionControlMessage = {
  type: "remote-subscription-change"
  senderId: PeerId
  targetId: PeerId

  /** The storage IDs to add to the subscription */
  add?: StorageId[]

  /** The storage IDs to remove from the subscription */
  remove?: StorageId[]
}

/**
 * Sent by a {@link Repo} to indicate that the heads of a document have changed on a remote peer.
 */
export type RemoteHeadsChanged = {
  type: "remote-heads-changed"
  senderId: PeerId
  targetId: PeerId

  /** The document ID of the document that has changed */
  documentId: DocumentId

  /** The document's new heads */
  newHeads: { [key: StorageId]: { heads: string[]; timestamp: number } }
}

/** These are message types that a {@link NetworkAdapter} surfaces to a {@link Repo}. */
export type RepoMessage =
  | SyncMessage
  | EphemeralMessage
  | RequestMessage
  | DocumentUnavailableMessage
  | RemoteSubscriptionControlMessage
  | RemoteHeadsChanged

/** These are message types that are handled by the {@link CollectionSynchronizer}.*/
export type DocMessage =
  | SyncMessage
  | EphemeralMessage
  | RequestMessage
  | DocumentUnavailableMessage

/**
 * The contents of a message, without the sender ID or other properties added by the {@link NetworkSubsystem})
 */
export type MessageContents<T extends Message = RepoMessage> =
  T extends EphemeralMessage
    ? Omit<T, "senderId" | "count" | "sessionId">
    : Omit<T, "senderId">

// TYPE GUARDS

export const isRepoMessage = (message: Message): message is RepoMessage =>
  isSyncMessage(message) ||
  isEphemeralMessage(message) ||
  isRequestMessage(message) ||
  isDocumentUnavailableMessage(message) ||
  isRemoteSubscriptionControlMessage(message) ||
  isRemoteHeadsChanged(message)

// prettier-ignore
export const isDocumentUnavailableMessage = (msg: Message): msg is DocumentUnavailableMessage => 
  msg.type === "doc-unavailable"

export const isRequestMessage = (msg: Message): msg is RequestMessage =>
  msg.type === "request"

export const isSyncMessage = (msg: Message): msg is SyncMessage =>
  msg.type === "sync"

export const isEphemeralMessage = (msg: Message): msg is EphemeralMessage =>
  msg.type === "ephemeral"

// prettier-ignore
export const isRemoteSubscriptionControlMessage = (msg: Message): msg is RemoteSubscriptionControlMessage =>
  msg.type === "remote-subscription-change"

export const isRemoteHeadsChanged = (msg: Message): msg is RemoteHeadsChanged =>
  msg.type === "remote-heads-changed"
